import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'
import { getNotifications, markNotificationsRead } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const unreadOnly = req.nextUrl.searchParams.get('unread') !== 'false'
    const notifications = await getNotifications(getAdminClient(), user.id, unreadOnly)
    return NextResponse.json(notifications)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Mark all of the current user's notifications as read
export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await markNotificationsRead(getAdminClient(), user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
