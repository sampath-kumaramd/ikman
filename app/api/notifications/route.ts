import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getNotifications, markNotificationsRead } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const unreadOnly = req.nextUrl.searchParams.get('unread') !== 'false'
    const db = getAdminClient()
    const notifications = await getNotifications(db, unreadOnly)
    return NextResponse.json(notifications)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Mark all notifications as read
export async function POST() {
  try {
    const db = getAdminClient()
    await markNotificationsRead(db)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
