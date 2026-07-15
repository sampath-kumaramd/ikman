import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { getLatestScrapeRun } from '@/lib/db'
import { toPublicScrapeStatus } from '@/lib/scrape-status-public'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const run = await getLatestScrapeRun(getAdminClient())
    return NextResponse.json(toPublicScrapeStatus(run))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
