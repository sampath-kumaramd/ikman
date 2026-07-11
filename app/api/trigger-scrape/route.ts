import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { triggerScrape } from '@/lib/trigger-scrape'

// Triggers the GitHub Actions workflow_dispatch so the user can hit
// "Run Now" from the UI without waiting for the cron schedule.
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await triggerScrape(getAdminClient())

  if (!result.ok) {
    const headers: HeadersInit = {}
    if (result.retryAfterSec != null) {
      headers['Retry-After'] = String(result.retryAfterSec)
    }
    return NextResponse.json({ error: result.error }, { status: result.status, headers })
  }

  return NextResponse.json({ ok: true, message: result.message })
}
