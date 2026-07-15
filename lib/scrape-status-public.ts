import type { ScrapeRun } from './types'

/**
 * Map stored scrape_runs rows to user-safe dashboard copy.
 * Hides multi-user internals (user counts, area×type unions, global totals).
 * Also rewrites older leaky steps already in the DB.
 */
export function toPublicScrapeStatus(
  run: ScrapeRun | null,
): (ScrapeRun & { status: string }) | { status: 'idle' } {
  if (!run) return { status: 'idle' }

  const publicSteps = (run.steps_log ?? [])
    .map(sanitizeStepText)
    .filter((s, i, arr) => s.length > 0 && s !== arr[i - 1])

  const current =
    run.status === 'done' || run.status === 'failed'
      ? sanitizeStepText(run.current_step ?? '') ||
        (run.status === 'done'
          ? 'Scan finished — check your dashboard for new matches'
          : 'Scan failed — we will try again on the next schedule')
      : sanitizeStepText(run.current_step ?? '') || 'Scanning…'

  return {
    ...run,
    current_step: current,
    steps_log: publicSteps.length ? publicSteps : [current],
    // Don't surface global pool counters on the client
    new_count: 0,
    total_count: 0,
    error: run.status === 'failed' ? null : run.error,
  }
}

function sanitizeStepText(raw: string): string {
  const text = raw.replace(/<\/?[^>]+>/g, '').trim()
  if (!text) return ''

  const lower = text.toLowerCase()

  // Already-safe modern messages
  if (
    /^(starting|preparing search|scanning ikman|checking for new|found new listings|loading listing details|saving results|sending your alerts|almost done|scan finished|scan failed)/i.test(
      text,
    )
  ) {
    return text
  }

  // Legacy / leaky patterns → generic phases
  if (/active user|onboarded/i.test(lower)) return 'Preparing search…'
  if (/existing listing|in db/i.test(lower)) return 'Scanning ikman.lk…'
  if (/scraping\s+\d+\s*area|area\(s\).*type|union filter/i.test(lower)) {
    return 'Scanning ikman.lk…'
  }
  if (/scraped\s+\d+/i.test(lower)) return 'Checking for new listings…'
  if (/\d+\s*new listing/i.test(lower)) return 'Found new listings…'
  if (/fetching detail|details\s+\d+\/\d+/i.test(lower)) return 'Loading listing details…'
  if (/saving to database|upsert/i.test(lower)) return 'Saving results…'
  if (/saved\s+\d+/i.test(lower)) return 'Saving results…'
  if (/telegram alert|sent\s+\d+/i.test(lower)) return 'Sending your alerts…'
  if (/failed:/i.test(lower)) return 'Scan failed — we will try again on the next schedule'
  if (/no new listing|😴|✅/i.test(lower)) {
    return 'Scan finished — check your dashboard for new matches'
  }
  if (/queued via|dispatched to github/i.test(lower)) return 'Scan queued…'

  // Unknown legacy text: hide rather than leak
  if (/\d+\s*(area|user|type|listing)/i.test(lower)) return 'Scanning…'

  return text
}
