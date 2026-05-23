import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getSettings, updateSetting } from '@/lib/db'
import type { AppSettings } from '@/lib/types'

export async function GET() {
  try {
    const db = getAdminClient()
    const settings = await getSettings(db)
    return NextResponse.json(settings)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AppSettings>
    const db = getAdminClient()

    const settingEntries: Array<[string, unknown]> = [
      ['areas',                   body.areas],
      ['listing_types',           body.listing_types],
      ['max_price',               body.max_price],
      ['min_bedrooms',            body.min_bedrooms],
      ['max_bedrooms',            body.max_bedrooms],
      ['scrape_interval_minutes', body.scrape_interval_minutes],
      ['whatsapp_number',         body.whatsapp_number],
      ['notifications_enabled',   body.notifications_enabled],
    ]

    await Promise.all(
      settingEntries
        .filter(([, val]) => val !== undefined)
        .map(([key, val]) => updateSetting(db, key, val)),
    )

    const updated = await getSettings(db)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
