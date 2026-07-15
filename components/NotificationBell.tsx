'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { NotificationItem } from '@/components/NotificationItem'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

type Tab = 'unread' | 'all'

export function NotificationBell() {
  const [tab, setTab] = useState<Tab>('unread')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async (which: Tab = tab) => {
    setLoading(true)
    try {
      const [listRes, unreadRes] = await Promise.all([
        fetch(`/api/notifications?unread=${which === 'unread'}`),
        // Always refresh badge from unread list
        which === 'unread'
          ? null
          : fetch('/api/notifications?unread=true'),
      ])

      if (listRes.ok) {
        const list = (await listRes.json()) as Notification[]
        setNotifications(Array.isArray(list) ? list : [])
        if (which === 'unread') {
          setUnreadCount(Array.isArray(list) ? list.length : 0)
        }
      }

      if (unreadRes?.ok) {
        const unread = (await unreadRes.json()) as Notification[]
        setUnreadCount(Array.isArray(unread) ? unread.length : 0)
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

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

  useEffect(() => {
    const t = setTimeout(() => load('unread'), 0)
    const id = setInterval(() => load(tab), 60_000)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [load, tab])

  useEffect(() => {
    if (open) void load(tab)
  }, [open, tab, load])

  useEffect(() => {
    function onPointer(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Prevent background scroll when the mobile sheet is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    if (window.matchMedia('(max-width: 639px)').matches) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        className="relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center bg-orange-500 p-0 text-[10px] hover:bg-orange-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Mobile dim backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              'z-50 overflow-hidden border border-white/10 bg-[#0b0f1a]/95 shadow-2xl backdrop-blur-xl',
              // Mobile: bottom sheet
              'fixed inset-x-0 bottom-0 max-h-[min(85dvh,36rem)] rounded-t-2xl',
              'pb-[env(safe-area-inset-bottom)]',
              // Desktop: anchored dropdown
              'sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-11 sm:w-[22rem] sm:max-h-none sm:rounded-2xl sm:pb-0',
            )}
            role="dialog"
            aria-label="Notifications"
          >
            {/* Grab handle (mobile) */}
            <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-white/15" />
            </div>

            <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-2 sm:px-4 sm:pt-3">
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-[11px] text-zinc-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'You are all caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  disabled={marking}
                  className="h-8 shrink-0 gap-1.5 px-2 text-xs text-zinc-300"
                >
                  {marking ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCheck size={13} />
                  )}
                  Mark all read
                </Button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3.5 pb-2 sm:px-4">
              {(
                [
                  { id: 'unread' as const, label: 'Unread' },
                  { id: 'all' as const, label: 'All' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                    tab === t.id
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Separator className="opacity-50" />

            <ScrollArea className="h-[min(50dvh,20rem)] sm:h-80">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-zinc-600" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-zinc-500">
                  {tab === 'unread'
                    ? 'No unread alerts. New matches show up here.'
                    : 'No notifications yet. Alerts appear when scrapes find matches.'}
                </p>
              ) : (
                <div>
                  {notifications.map((n, i) => (
                    <div key={n.id}>
                      <NotificationItem notification={n} compact />
                      {i < notifications.length - 1 && (
                        <Separator className="opacity-40" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="opacity-50" />
            <div className="p-2 sm:p-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/10"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
