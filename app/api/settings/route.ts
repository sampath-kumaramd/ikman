import { NextRequest, NextResponse } from 'next/server'
import { isSupportedArea } from '@/lib/areas'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/supabase-server'
import { DEFAULT_CRITERIA, LISTING_TYPES, getUserSettings, upsertUserSettings } from '@/lib/db'
import type { ListingType, SettingsResponse, UserSettings } from '@/lib/types'

function toResponse(s: UserSettings | null): SettingsResponse {
  return {
    areas:                 s?.areas ?? DEFAULT_CRITERIA.areas,
    listing_types:         s?.listing_types ?? DEFAULT_CRITERIA.listing_types,
    max_price:             s?.max_price ?? DEFAULT_CRITERIA.max_price,
    min_bedrooms:          s?.min_bedrooms ?? DEFAULT_CRITERIA.min_bedrooms,
    max_bedrooms:          s?.max_bedrooms ?? DEFAULT_CRITERIA.max_bedrooms,
    notifications_enabled: s?.notifications_enabled ?? true,
    telegram_connected:    !!s?.telegram_chat_id,
    onboarding_completed:  s?.onboarding_completed ?? false,
  }
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await getUserSettings(getAdminClient(), user.id)
    return NextResponse.json(toResponse(settings))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as Partial<SettingsResponse>
    const patch: Record<string, unknown> = {}

    if (Array.isArray(body.areas)) {
      patch.areas = body.areas.filter(
        (a): a is string => typeof a === 'string' && !!a.trim() && isSupportedArea(a),
      )
    }
    if (Array.isArray(body.listing_types)) {
      patch.listing_types = body.listing_types.filter(
        (t): t is ListingType => LISTING_TYPES.includes(t as ListingType),
      )
    }
    if (typeof body.max_price === 'number'    && body.max_price > 0)    patch.max_price = body.max_price
    if (typeof body.min_bedrooms === 'number' && body.min_bedrooms > 0) patch.min_bedrooms = body.min_bedrooms
    if (typeof body.max_bedrooms === 'number' && body.max_bedrooms > 0) patch.max_bedrooms = body.max_bedrooms
    if (typeof body.notifications_enabled === 'boolean') {
      patch.notifications_enabled = body.notifications_enabled
    }

    const updated = await upsertUserSettings(getAdminClient(), user.id, patch)
    return NextResponse.json(toResponse(updated))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
