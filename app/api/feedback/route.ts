import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase'
import { sendFeedbackEmail } from '@/lib/email'
import { sendTelegram } from '@/scraper/telegram'

const CATEGORIES = new Set(['feature', 'bug', 'question', 'other'])
const MAX_MESSAGE = 2000

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      category?: string
      message?: string
      page?: string
    }

    const category = (body.category ?? 'feature').toLowerCase().trim()
    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (message.length < 5) {
      return NextResponse.json({ error: 'Please write a bit more (at least 5 characters).' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `Message is too long (max ${MAX_MESSAGE} characters).` }, { status: 400 })
    }

    const page =
      typeof body.page === 'string' ? body.page.trim().slice(0, 200) : null

    const db = getAdminClient()
    const { data, error } = await db
      .from('feedback')
      .insert({
        user_id: user.id,
        email: user.email,
        category,
        message,
        page,
      })
      .select('id, created_at')
      .single()

    if (error) {
      if (error.code === '42P01' || /relation .* does not exist/i.test(error.message)) {
        return NextResponse.json(
          {
            error:
              'Feedback storage is not set up yet. Run supabase/migration-feedback.sql in the Supabase SQL Editor.',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Email to FEEDBACK_TO_EMAIL when Resend is configured
    const emailSent = await sendFeedbackEmail({
      id: data.id,
      category,
      message,
      page,
      userId: user.id,
      userEmail: user.email,
      createdAt: data.created_at,
    })

    // Optional Telegram admin ping
    const token = process.env.TELEGRAM_BOT_TOKEN
    const adminChat =
      process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID
    if (token && adminChat) {
      const preview = message.length > 400 ? `${message.slice(0, 400)}…` : message
      const lines = [
        `💬 <b>New ${escapeHtml(category)} request</b>`,
        user.email ? `From: ${escapeHtml(user.email)}` : `User: <code>${escapeHtml(user.id)}</code>`,
        page ? `Page: ${escapeHtml(page)}` : null,
        emailSent ? '📧 Email sent' : '📧 Email skipped (no RESEND_API_KEY or send failed)',
        '',
        escapeHtml(preview),
      ].filter(Boolean)
      void sendTelegram(token, adminChat, lines.join('\n'))
    }

    return NextResponse.json({ ok: true, id: data.id, email_sent: emailSent })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
