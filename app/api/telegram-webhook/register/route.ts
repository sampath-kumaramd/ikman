import { NextRequest, NextResponse } from 'next/server'

// Call this once after deploying to register your webhook URL with Telegram.
// GET /api/telegram-webhook/register?url=https://your-app.vercel.app
// Or it auto-detects the host from the request if ?url is omitted.
export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
  }

  const appUrl =
    req.nextUrl.searchParams.get('url') ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const webhookUrl = `${appUrl}/api/telegram-webhook`

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
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
  } else {
    return NextResponse.json({ ok: false, error: data.description }, { status: 500 })
  }
}
