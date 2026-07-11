import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/supabase-server'

/**
 * Delete the current user's account and all per-user data.
 * Auth user delete cascades user_settings / notifications / user_listing_states
 * (see FK ON DELETE CASCADE in schema).
 */
export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
