import { NextResponse } from 'next/server'

/** Legacy Supabase auth callback — sessions are managed by Clerk now. */
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/sign-in', req.url))
}
