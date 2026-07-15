'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCheck, Loader2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NotificationItem } from '@/components/NotificationItem'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

type Tab = 'all' | 'unread'

export function NotificationsPageClient() {
  const [tab, setTab] = useState<Tab>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async (which: Tab) => {
    setLoading(true)
    try {
      const [listRes, unreadRes] = await Promise.all([
        fetch(`/api/notifications?unread=${which === 'unread'}`),
        fetch('/api/notifications?unread=true'),
      ])
      if (listRes.ok) {
        const list = (await listRes.json()) as Notification[]
        setNotifications(Array.isArray(list) ? list : [])
      }
      if (unreadRes.ok) {
        const unread = (await unreadRes.json()) as Notification[]
        setUnreadCount(Array.isArray(unread) ? unread.length : 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(tab)
  }, [tab, load])

  async function markAllRead() {
    setMarking(true)
    try {
      await fetch('/api/notifications', { method: 'POST' })
      setUnreadCount(0)
      if (tab === 'unread') {
        setNotifications([])
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Notifications
          </h1>
          <p className="text-sm text-zinc-500">
            {unreadCount > 0
              ? `${unreadCount} unread · last 50 alerts`
              : 'Listing alerts from your scrape matches'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={markAllRead}
            disabled={marking}
            className="h-9 w-full shrink-0 gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] sm:w-auto"
          >
            {marking ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCheck size={15} />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'unread' as const, label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-white/[0.06]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-zinc-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
              <Bell size={22} />
            </div>
            <p className="font-medium text-white">
              {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="max-w-xs text-sm text-zinc-500">
              {tab === 'unread'
                ? 'You are all caught up. New matching listings will show here.'
                : 'When a scrape finds listings that match your criteria, they appear here and on Telegram if connected.'}
            </p>
            <Link
              href="/dashboard"
              className="mt-2 text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div>
            {notifications.map((n, i) => (
              <div key={n.id}>
                <NotificationItem notification={n} />
                {i < notifications.length - 1 && (
                  <Separator className="opacity-40" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && notifications.length > 0 && (
        <p className="text-center text-[11px] text-zinc-600">
          Showing up to 50 most recent notifications
        </p>
      )}
    </div>
  )
}
