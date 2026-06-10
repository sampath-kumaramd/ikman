import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/supabase-server'
import { getUserSettings, upsertUserSettings } from '@/lib/db'
import { getBotUsername } from '@/scraper/telegram'

// GET — current connection status
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await getUserSettings(getAdminClient(), user.id)
    return NextResponse.json({ connected: !!settings?.telegram_chat_id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST — generate a one-time connect code and return the t.me deep link.
// The user presses Start in Telegram; the webhook captures their chat id.
export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 })
    }

    const username = await getBotUsername(token)
    if (!username) {
      return NextResponse.json({ error: 'Could not reach the Telegram bot — check TELEGRAM_BOT_TOKEN' }, { status: 502 })
    }

    const code = randomUUID().replace(/-/g, '')
    await upsertUserSettings(getAdminClient(), user.id, { telegram_connect_code: code })

    return NextResponse.json({ link: `https://t.me/${username}?start=${code}` })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE — unlink the user's Telegram chat
export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await upsertUserSettings(getAdminClient(), user.id, {
      telegram_chat_id: null,
      telegram_connect_code: null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
