import { NextRequest, NextResponse } from 'next/server'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SETUP_SECRET
  if (!secret) return false

  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true

  const querySecret = req.nextUrl.searchParams.get('secret')
  return querySecret === secret
}

// Call this once after deploying to register your webhook URL with Telegram.
// GET /api/telegram-webhook/register?secret=YOUR_ADMIN_SETUP_SECRET
// Optional: &url=https://your-app.vercel.app  (defaults to this request's host)
// Or: Authorization: Bearer YOUR_ADMIN_SETUP_SECRET
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'TELEGRAM_WEBHOOK_SECRET not set — generate a random string and add it to env first' },
      { status: 500 },
    )
  }

  const appUrl =
    req.nextUrl.searchParams.get('url') ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram-webhook`

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    },
  )

  const data = await res.json()

  if (data.ok) {
    return NextResponse.json({
      ok: true,
      message: `Webhook registered at ${webhookUrl}`,
    })
  }

  return NextResponse.json({ ok: false, error: data.description }, { status: 500 })
}
