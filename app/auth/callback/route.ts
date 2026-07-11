import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

/** Only allow same-origin relative paths (no open redirects). */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

// Handles the email-confirmation / magic-link / password-recovery redirect from Supabase.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = safeNextPath(req.nextUrl.searchParams.get('next'))

  if (code) {
    const supabase = await getServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, req.nextUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', req.nextUrl.origin))
}
