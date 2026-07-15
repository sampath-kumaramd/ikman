import type { SupabaseClient } from '@supabase/supabase-js'

const TELEGRAM_API = 'https://api.telegram.org'
const TG_EDIT_THROTTLE_MS = 2500  // Telegram allows ~1 edit/sec; we're conservative

/**
 * Progress for a scrape run.
 *
 * - `step(publicText)` → written to scrape_runs (every user's dashboard)
 * - optional `adminDetail` → console + admin Telegram only (never other users)
 */
export class ScrapeProgress {
  private runId:      string | null = null
  private msgId:      number | null = null
  /** User-visible steps (dashboard). */
  private steps:      string[]      = []
  /** Admin-only detail trail for Telegram. */
  private adminSteps: string[]      = []
  private lastEdit    = 0
  private readonly token:  string
  private readonly chatId: string

  constructor(private readonly db: SupabaseClient) {
    this.token  = process.env.TELEGRAM_BOT_TOKEN ?? ''
    // Optional admin chat for run-progress messages (users only get listing alerts)
    this.chatId = process.env.TELEGRAM_ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID ?? ''
  }

  async start(): Promise<void> {
    const { data } = await this.db
      .from('scrape_runs')
      .insert({ status: 'running', current_step: 'Starting…' })
      .select('id')
      .single()
    this.runId = data?.id ?? null

    if (this.token && this.chatId) {
      const msg = await this._tgSend('🔄 <b>Scrape started</b>\n<i>Loading settings…</i>')
      this.msgId = msg?.message_id ?? null
    }
  }

  /**
   * Log progress.
   * @param publicText Safe for all signed-in users (no area lists, user counts, etc.)
   * @param adminDetail Optional detail for logs + admin Telegram only
   */
  async step(publicText: string, adminDetail?: string): Promise<void> {
    // Avoid duplicate consecutive public steps (e.g. detail progress)
    if (this.steps[this.steps.length - 1] !== publicText) {
      this.steps.push(publicText)
    }
    const adminLine = adminDetail ?? publicText
    this.adminSteps.push(adminLine)
    console.log(`  [progress] ${adminLine}`)
    this._dbUpdate({ current_step: publicText, steps_log: this.steps })
    await this._tgEdit(this._progressTextHtml())
  }

  async done(newCount: number, totalCount: number): Promise<void> {
    // User-facing: no global scrape totals that reveal multi-user pool size
    const plain =
      newCount > 0
        ? 'Scan finished — check your dashboard for new matches'
        : 'Scan finished — no new matches this run'

    const html =
      newCount > 0
        ? `✅ <b>${newCount} new listing${newCount !== 1 ? 's' : ''} saved</b> (${totalCount} scraped total)`
        : `😴 No new listings this run (${totalCount} scraped)`

    console.log(`  [progress] done: ${newCount} new / ${totalCount} scraped`)

    await this.db.from('scrape_runs').update({
      status:       'done',
      current_step: plain,
      new_count:    newCount,
      total_count:  totalCount,
      finished_at:  new Date().toISOString(),
      steps_log:    this.steps,
    }).eq('id', this.runId)

    this.lastEdit = 0
    await this._tgEdit(html)
  }

  async fail(err: string): Promise<void> {
    const plain = 'Scan failed — we will try again on the next schedule'
    console.error(`  [progress] fail: ${err}`)

    await this.db.from('scrape_runs').update({
      status:       'failed',
      current_step: plain,
      error:        err,
      finished_at:  new Date().toISOString(),
      steps_log:    this.steps,
    }).eq('id', this.runId)

    this.lastEdit = 0
    await this._tgEdit(`❌ <b>Scrape failed</b>\n<code>${escapeHtml(err)}</code>`)
  }

  // ── private ────────────────────────────────────────────────────────────────

  private _progressTextHtml(): string {
    const recent = this.adminSteps.slice(-8)
    return [
      '🔄 <b>Scrape in progress</b>',
      '',
      ...recent.map((s, i) =>
        i === recent.length - 1 ? `⏳ ${escapeHtml(s)}` : `✓ ${escapeHtml(s)}`,
      ),
    ].join('\n')
  }

  private _dbUpdate(patch: Record<string, unknown>): void {
    if (!this.runId) return
    void this.db.from('scrape_runs').update(patch).eq('id', this.runId).then(
      ({ error }) => { if (error) console.error('progress DB update:', error.message) },
    )
  }

  private async _tgSend(text: string): Promise<{ message_id: number } | null> {
    if (!this.token || !this.chatId) return null
    try {
      const res  = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'HTML' }),
      })
      const data = await res.json()
      return data.result ?? null
    } catch { return null }
  }

  private async _tgEdit(text: string): Promise<void> {
    if (!this.msgId || !this.token || !this.chatId) return
    const now = Date.now()
    if (now - this.lastEdit < TG_EDIT_THROTTLE_MS) return
    this.lastEdit = now
    try {
      await fetch(`${TELEGRAM_API}/bot${this.token}/editMessageText`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    this.chatId,
          message_id: this.msgId,
          text,
          parse_mode: 'HTML',
        }),
      })
    } catch { /* ignore — non-fatal */ }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
