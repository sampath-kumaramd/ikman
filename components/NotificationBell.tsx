'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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
    const id = setInterval(load, 60_000) // refresh every minute
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-800">
              {notifications.length > 0 ? `${notifications.length} new listings` : 'No new listings'}
            </span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">You&apos;re all caught up!</p>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href={n.listing?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm font-medium text-gray-800 line-clamp-1">
                    {n.listing?.title ?? 'New listing'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {n.listing?.price ? `Rs. ${n.listing.price.toLocaleString()}/mo · ` : ''}
                    {n.listing?.area ?? ''}
                    {n.listing?.bedrooms ? ` · ${n.listing.bedrooms} BR` : ''}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    {n.whatsapp_sent && ' · 📱 WhatsApp sent'}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
