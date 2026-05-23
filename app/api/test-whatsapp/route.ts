import { NextResponse } from 'next/server'
import { sendTelegram } from '../../../scraper/telegram'

export async function POST() {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  const missing = [
    !token  && 'TELEGRAM_BOT_TOKEN',
    !chatId && 'TELEGRAM_CHAT_ID',
  ].filter(Boolean)

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Missing env vars: ${missing.join(', ')}` },
      { status: 500 },
    )
  }

  const message = `🔔 <b>ikman tracker — test message</b>\nTelegram connection is working ✅\n${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`

  const sent = await sendTelegram(token!, chatId!, message)

  if (sent) {
    return NextResponse.json({ ok: true, message: `Test message sent to chat ${chatId}` })
  } else {
    return NextResponse.json(
      { ok: false, error: 'Telegram returned an error — check server logs for details' },
      { status: 502 },
    )
  }
}
