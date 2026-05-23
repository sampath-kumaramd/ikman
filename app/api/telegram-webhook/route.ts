import { NextRequest, NextResponse } from 'next/server'
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

async function reply(token: string, chatId: string, text: string) {
  await sendTelegram(token, chatId, text)
}

export async function POST(req: NextRequest) {
  const token        = process.env.TELEGRAM_BOT_TOKEN
  const allowedChat  = process.env.TELEGRAM_CHAT_ID

  // Always return 200 to Telegram (otherwise it retries endlessly)
  if (!token || !allowedChat) {
    return NextResponse.json({ ok: true })
  }

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

  // Security: only respond to the authorised chat
  if (chatId !== allowedChat) {
    console.warn(`Telegram: ignored message from unauthorised chat ${chatId}`)
    return NextResponse.json({ ok: true })
  }

  if (command === '/scrape' || command === '/run') {
    await reply(token, chatId, '⏳ Starting scrape… results arrive in ~2 minutes.')
    const result = await triggerGithubScrape()
    if (result.ok) {
      await reply(token, chatId, '✅ Scrape triggered via GitHub Actions.')
    } else {
      await reply(token, chatId, `❌ Failed to trigger scrape: ${result.error}`)
    }

  } else if (command === '/status') {
    const uptime = process.uptime()
    const mins   = Math.floor(uptime / 60)
    await reply(
      token, chatId,
      `🟢 <b>ikman tracker is running</b>\nServer uptime: ${mins} min\nScraper runs every 30 min via GitHub Actions.`,
    )

  } else if (command === '/help' || command === '/start') {
    const lines = [
      '🏠 <b>ikman Rental Tracker</b>',
      '',
      'Available commands:',
      ...Object.entries(COMMANDS).map(([cmd, desc]) => `${cmd} — ${desc}`),
    ]
    await reply(token, chatId, lines.join('\n'))

  } else if (text) {
    await reply(token, chatId, `Unknown command. Send /help to see what I can do.`)
  }

  return NextResponse.json({ ok: true })
}
