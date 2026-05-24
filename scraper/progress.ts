import type { SupabaseClient } from '@supabase/supabase-js'

const TELEGRAM_API = 'https://api.telegram.org'
const TG_EDIT_THROTTLE_MS = 2500  // Telegram allows ~1 edit/sec; we're conservative

export class ScrapeProgress {
  private runId:      string | null = null
  private msgId:      number | null = null
  private steps:      string[]      = []
  private lastEdit    = 0
  private readonly token:  string
  private readonly chatId: string

  constructor(private readonly db: SupabaseClient) {
    this.token  = process.env.TELEGRAM_BOT_TOKEN ?? ''
    this.chatId = process.env.TELEGRAM_CHAT_ID   ?? ''
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

  /** Log a progress step. Fires DB update eagerly; throttles Telegram edits. */
  async step(text: string): Promise<void> {
    this.steps.push(text)
    console.log(`  [progress] ${text}`)
    this._dbUpdate({ current_step: text, steps_log: this.steps })  // fire-and-forget
    await this._tgEdit(this._progressText())
  }

  async done(newCount: number, totalCount: number): Promise<void> {
    const line = newCount > 0
      ? `✅ <b>${newCount} new listing${newCount !== 1 ? 's' : ''} saved</b> (${totalCount} scraped total)`
      : `😴 No new listings this run (${totalCount} scraped)`

    await this.db.from('scrape_runs').update({
      status:      'done',
      current_step: line,
      new_count:   newCount,
      total_count: totalCount,
      finished_at: new Date().toISOString(),
      steps_log:   this.steps,
    }).eq('id', this.runId)

    // Force-edit the final state regardless of throttle
    this.lastEdit = 0
    await this._tgEdit(line)
  }

  async fail(err: string): Promise<void> {
    await this.db.from('scrape_runs').update({
      status:      'failed',
      current_step: `Failed: ${err}`,
      error:        err,
      finished_at:  new Date().toISOString(),
      steps_log:    this.steps,
    }).eq('id', this.runId)

    this.lastEdit = 0
    await this._tgEdit(`❌ <b>Scrape failed</b>\n<code>${err}</code>`)
  }

  // ── private ────────────────────────────────────────────────────────────────

  private _progressText(): string {
    const recent = this.steps.slice(-6)
    return [
      '🔄 <b>Scrape in progress</b>',
      '',
      ...recent.map((s, i) =>
        i === recent.length - 1 ? `⏳ ${s}` : `✓ ${s}`,
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
