'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch('/api/notifications?unread=true')
    if (res.ok) setNotifications(await res.json())
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'POST' })
    setNotifications([])
    setOpen(false)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[10px] bg-orange-500 hover:bg-orange-500">
            {notifications.length > 9 ? '9+' : notifications.length}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-popover rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold text-sm">
              {notifications.length > 0 ? `${notifications.length} new listings` : 'Notifications'}
            </span>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
                Mark all read
              </Button>
            )}
          </div>
          <Separator />

          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You&apos;re all caught up!
              </p>
            ) : (
              <div>
                {notifications.map((n, i) => (
                  <div key={n.id}>
                    <a
                      href={n.listing?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium line-clamp-1">
                        {n.listing?.title ?? 'New listing'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {n.listing?.price ? `Rs. ${n.listing.price.toLocaleString()}/mo · ` : ''}
                        {n.listing?.area ?? ''}
                        {n.listing?.bedrooms ? ` · ${n.listing.bedrooms} BR` : ''}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        {n.whatsapp_sent && ' · 📱 WhatsApp sent'}
                      </span>
                    </a>
                    {i < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
