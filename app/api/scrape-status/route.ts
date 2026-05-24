import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getLatestScrapeRun } from '@/lib/db'

export async function GET() {
  try {
    const db  = getAdminClient()
    const run = await getLatestScrapeRun(db)
    return NextResponse.json(run ?? { status: 'idle' })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
