import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

/**
 * Delete the current user's app data + Clerk account.
 * App tables are keyed by Clerk user id (TEXT); delete rows then Clerk user.
 */
export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const userId = user.id

    // Order: children of listings FKs first, then settings
    await admin.from('user_listing_states').delete().eq('user_id', userId)
    await admin.from('notifications').delete().eq('user_id', userId)
    await admin.from('user_settings').delete().eq('user_id', userId)

    const client = await clerkClient()
    await client.users.deleteUser(userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
