import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { findUserByChatId, findUserByConnectCode, linkTelegramChat } from '@/lib/db'
import { sendTelegram } from '../../../scraper/telegram'

const COMMANDS: Record<string, string> = {
  '/scrape': 'Trigger a scrape run',
  '/status': 'Show bot status',
  '/help':   'Show available commands',
}

async function triggerGithubScrape(): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GITHUB_PAT
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return { ok: false, error: 'GITHUB_PAT / GITHUB_OWNER / GITHUB_REPO not set' }
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: process.env.GITHUB_BRANCH ?? 'master' }),
    },
  )

  return res.ok ? { ok: true } : { ok: false, error: `GitHub ${res.status}` }
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN

  // Always return 200 to Telegram (otherwise it retries endlessly)
  if (!token) return NextResponse.json({ ok: true })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = (body.message ?? body.edited_message) as Record<string, unknown> | undefined
  if (!message) return NextResponse.json({ ok: true })

  const chatId  = String((message.chat as Record<string, unknown>)?.id ?? '')
  const text    = ((message.text as string) ?? '').trim()
  const command = text.split(' ')[0].toLowerCase()  // handle "/scrape@botname" format too
  if (!chatId) return NextResponse.json({ ok: true })

  const reply = (msg: string) => sendTelegram(token, chatId, msg)
  const db = getAdminClient()

  // ── Account linking: /start <connect-code> ─────────────────────────────────
  if (command === '/start' || command.startsWith('/start@')) {
    const code = text.split(' ')[1]?.trim()

    if (code) {
      const pending = await findUserByConnectCode(db, code)
      if (pending) {
        await linkTelegramChat(db, pending.user_id, chatId)
        await reply(
          '✅ <b>Telegram connected!</b>\n' +
          'You\'ll get an alert here whenever a new listing matches your search.\n\n' +
          'Go back to the app to finish setup.',
        )
        return NextResponse.json({ ok: true })
      }
      await reply('❌ That connect link has expired. Generate a new one from the app and try again.')
      return NextResponse.json({ ok: true })
    }

    await reply(
      '🏠 <b>ikman Rental Tracker</b>\n\n' +
      'To link this chat to your account, use the <b>Connect Telegram</b> button in the app — ' +
      'it opens this chat with a one-time code.',
    )
    return NextResponse.json({ ok: true })
  }

  // ── Commands: only for chats linked to an account ──────────────────────────
  const linkedUser = await findUserByChatId(db, chatId)
  if (!linkedUser) {
    if (text) {
      await reply('This chat isn\'t linked to a tracker account yet. Use the Connect Telegram button in the app.')
    }
    return NextResponse.json({ ok: true })
  }

  if (command === '/scrape' || command === '/run') {
    await reply('⏳ Starting scrape… results arrive in ~2 minutes.')
    const result = await triggerGithubScrape()
    if (result.ok) {
      await reply('✅ Scrape triggered via GitHub Actions.')
    } else {
      await reply(`❌ Failed to trigger scrape: ${result.error}`)
    }

  } else if (command === '/status') {
    const areas = linkedUser.areas.join(', ') || '—'
    await reply(
      `🟢 <b>ikman tracker is running</b>\n` +
      `Watching: ${areas}\n` +
      `Max rent: Rs. ${linkedUser.max_price.toLocaleString()}\n` +
      `Alerts: ${linkedUser.notifications_enabled ? 'on' : 'off'}`,
    )

  } else if (command === '/help') {
    const lines = [
      '🏠 <b>ikman Rental Tracker</b>',
      '',
      'Available commands:',
      ...Object.entries(COMMANDS).map(([cmd, desc]) => `${cmd} — ${desc}`),
    ]
    await reply(lines.join('\n'))

  } else if (text) {
    await reply('Unknown command. Send /help to see what I can do.')
  }

  return NextResponse.json({ ok: true })
}
