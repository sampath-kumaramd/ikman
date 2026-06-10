import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/supabase-server'
import { getUserSettings, upsertUserSettings } from '@/lib/db'

// Mark onboarding as complete — requires saved criteria. Telegram is
// optional: it can be connected later from Settings; matches still show
// on the dashboard without it.
export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getAdminClient()
    const settings = await getUserSettings(db, user.id)

    if (!settings?.areas?.length || !settings.listing_types?.length) {
      return NextResponse.json(
        { error: 'Save your search criteria first (at least one area and property type)' },
        { status: 400 },
      )
    }

    await upsertUserSettings(db, user.id, { onboarding_completed: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
