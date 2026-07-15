import type { SupabaseClient } from '@supabase/supabase-js'
import { getLatestScrapeRun } from './db'

/** Minimum gap between manual scrape triggers (align with 10 min schedule). */
export const SCRAPE_COOLDOWN_MS = 10 * 60 * 1000

export type TriggerScrapeResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number; retryAfterSec?: number }

/**
 * Global cooldown: reject if a scrape is running or one started within SCRAPE_COOLDOWN_MS.
 * Uses scrape_runs so it works across serverless instances.
 */
export async function checkScrapeCooldown(
  client: SupabaseClient,
): Promise<{ allowed: true } | { allowed: false; error: string; retryAfterSec: number }> {
  const latest = await getLatestScrapeRun(client)

  if (!latest) return { allowed: true }

  if (latest.status === 'running') {
    return {
      allowed: false,
      error: 'A scrape is already running. Try again when it finishes.',
      retryAfterSec: 120,
    }
  }

  const startedAt = new Date(latest.started_at).getTime()
  if (Number.isNaN(startedAt)) return { allowed: true }

  const elapsed = Date.now() - startedAt
  if (elapsed < SCRAPE_COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((SCRAPE_COOLDOWN_MS - elapsed) / 1000)
    const mins = Math.ceil(retryAfterSec / 60)
    return {
      allowed: false,
      error: `Please wait ${mins} minute${mins === 1 ? '' : 's'} before triggering another scrape.`,
      retryAfterSec,
    }
  }

  return { allowed: true }
}

/** Dispatch the scrape.yml workflow via GitHub Actions. */
export async function dispatchGithubScrape(): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.GITHUB_PAT
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return { ok: false, error: 'GITHUB_PAT, GITHUB_OWNER, or GITHUB_REPO env vars are not set' }
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: process.env.GITHUB_BRANCH ?? 'master' }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `GitHub API error: ${res.status} – ${body}` }
  }

  return { ok: true }
}

/**
 * Cooldown check + GitHub dispatch. Shared by the dashboard API and Telegram /scrape.
 * Inserts a queued scrape_run so back-to-back triggers are blocked before Actions starts.
 */
export async function triggerScrape(client: SupabaseClient): Promise<TriggerScrapeResult> {
  const cooldown = await checkScrapeCooldown(client)
  if (!cooldown.allowed) {
    return {
      ok: false,
      error: cooldown.error,
      status: 429,
      retryAfterSec: cooldown.retryAfterSec,
    }
  }

  // Claim the cooldown slot before dispatch (covers the GitHub Actions queue delay)
  const { data: queued, error: queueError } = await client
    .from('scrape_runs')
    .insert({
      status: 'running',
      current_step: 'Queued via trigger…',
      steps_log: ['Queued via dashboard / Telegram'],
    })
    .select('id')
    .single()

  if (queueError) {
    return { ok: false, error: `Could not queue scrape: ${queueError.message}`, status: 500 }
  }

  const dispatch = await dispatchGithubScrape()
  if (!dispatch.ok) {
    if (queued?.id) {
      await client
        .from('scrape_runs')
        .update({
          status: 'failed',
          current_step: `Failed to dispatch: ${dispatch.error}`,
          error: dispatch.error,
          finished_at: new Date().toISOString(),
        })
        .eq('id', queued.id)
    }
    return { ok: false, error: dispatch.error, status: 500 }
  }

  // Mark queue done so we don't leave a stuck "running" row; started_at still
  // enforces the cooldown until the real GitHub Actions run takes over.
  if (queued?.id) {
    await client
      .from('scrape_runs')
      .update({
        status: 'done',
        current_step: 'Dispatched to GitHub Actions',
        finished_at: new Date().toISOString(),
      })
      .eq('id', queued.id)
  }

  return { ok: true, message: 'Scrape triggered via GitHub Actions' }
}
