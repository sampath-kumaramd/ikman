import { Resend } from 'resend'

export type FeedbackEmailPayload = {
  id: string
  category: string
  message: string
  page: string | null
  userId: string
  userEmail: string | null
  createdAt?: string
}

/**
 * Email feedback to the inbox configured in FEEDBACK_TO_EMAIL.
 * Uses Resend (https://resend.com) — free tier is enough for this.
 * Returns true if sent, false if skipped/failed (never throws to caller).
 */
export async function sendFeedbackEmail(payload: FeedbackEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.FEEDBACK_TO_EMAIL
  if (!to) {
    console.warn('FEEDBACK_TO_EMAIL not set — feedback email skipped')
    return false
  }
  // Resend free/test: use onboarding@resend.dev until you verify a domain
  const from =
    process.env.FEEDBACK_FROM_EMAIL ||
    'Rental Tracker <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — feedback email skipped')
    return false
  }

  try {
    const resend = new Resend(apiKey)
    const subject = `[Rental Tracker] ${payload.category}: ${payload.message.slice(0, 60)}${
      payload.message.length > 60 ? '…' : ''
    }`

    const text = [
      `New ${payload.category} from the app`,
      '',
      `From: ${payload.userEmail ?? '(no email)'}`,
      `User id: ${payload.userId}`,
      `Page: ${payload.page ?? '—'}`,
      `Feedback id: ${payload.id}`,
      payload.createdAt ? `At: ${payload.createdAt}` : null,
      '',
      '--- Message ---',
      payload.message,
    ]
      .filter(Boolean)
      .join('\n')

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111">
        <p style="margin:0 0 12px"><strong>New ${escapeHtml(payload.category)}</strong> from Rental Tracker</p>
        <table style="font-size:14px;border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0;color:#666">From</td><td>${escapeHtml(payload.userEmail ?? '(no email)')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666">User id</td><td style="font-family:monospace;font-size:12px">${escapeHtml(payload.userId)}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666">Page</td><td>${escapeHtml(payload.page ?? '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666">Id</td><td style="font-family:monospace;font-size:12px">${escapeHtml(payload.id)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px;margin:0">${escapeHtml(payload.message)}</pre>
      </div>
    `

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: payload.userEmail || undefined,
      subject,
      text,
      html,
    })

    if (error) {
      console.error('Resend error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('sendFeedbackEmail failed:', (err as Error).message)
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
