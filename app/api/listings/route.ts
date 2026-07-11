import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import {
  getListingsForUser, getUserSettings, markListingsViewed, setListingViewed,
} from '@/lib/db'
import type { ListingFilters } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const filters: ListingFilters = {
      area:         sp.get('area')         ?? undefined,
      listing_type: sp.get('listing_type') ?? undefined,
      max_price:    sp.get('max_price')    ? Number(sp.get('max_price'))    : undefined,
      min_price:    sp.get('min_price')    ? Number(sp.get('min_price'))    : undefined,
      min_bedrooms: sp.get('min_bedrooms') ? Number(sp.get('min_bedrooms')) : undefined,
      max_bedrooms: sp.get('max_bedrooms') ? Number(sp.get('max_bedrooms')) : undefined,
      is_new:       sp.get('is_new') === 'true' ? true : sp.get('is_new') === 'false' ? false : undefined,
      sort:         (sp.get('sort') as ListingFilters['sort']) ?? 'date_desc',
      page:         sp.get('page')  ? Number(sp.get('page'))  : 1,
      limit:        sp.get('limit') ? Number(sp.get('limit')) : 20,
    }

    const db = getAdminClient()
    const settings = await getUserSettings(db, user.id)
    if (!settings) return NextResponse.json({ listings: [], total: 0 })

    const result = await getListingsForUser(db, settings, filters)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Mark specific listings as viewed for the current user (no longer "new")
// Body: { ids: string[] }            — bulk mark viewed
//       { id: string, is_new: bool } — single toggle viewed/unviewed
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { ids?: string[]; id?: string; is_new?: boolean }
    const db = getAdminClient()

    if (body.id !== undefined && body.is_new !== undefined) {
      await setListingViewed(db, user.id, body.id, !body.is_new)
    } else if (body.ids?.length) {
      await markListingsViewed(db, user.id, body.ids)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
