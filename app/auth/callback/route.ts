import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

// Handles the email-confirmation / magic-link redirect from Supabase.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (code) {
    const supabase = await getServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', req.nextUrl.origin))
}
