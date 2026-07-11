import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { getUserSettings } from '@/lib/db'
import { sendTelegram } from '@/scraper/telegram'

// Send a test message to the current user's linked Telegram chat
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 })
  }

  const settings = await getUserSettings(getAdminClient(), user.id)
  if (!settings?.telegram_chat_id) {
    return NextResponse.json({ ok: false, error: 'Telegram is not connected yet' }, { status: 400 })
  }

  const message = `🔔 <b>ikman tracker — test message</b>\nTelegram connection is working ✅\n${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`

  const sent = await sendTelegram(token, settings.telegram_chat_id, message)

  if (sent) {
    return NextResponse.json({ ok: true, message: 'Test message sent — check Telegram' })
  }
  return NextResponse.json(
    { ok: false, error: 'Telegram returned an error — check server logs for details' },
    { status: 502 },
  )
}
