'use client'

import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, MapPin, BedDouble, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

function formatPrice(price: number | null | undefined) {
  if (price == null) return null
  return `Rs. ${price.toLocaleString()}/mo`
}

export function NotificationItem({
  notification,
  compact = false,
}: {
  notification: Notification
  compact?: boolean
}) {
  const listing = notification.listing
  const title = listing?.title ?? 'New listing'
  const price = formatPrice(listing?.price ?? null)
  const area = listing?.area
  const bedrooms = listing?.bedrooms
  const href = listing?.url
  const unread = !notification.read

  const meta = [price, area, bedrooms != null ? `${bedrooms} BR` : null]
    .filter(Boolean)
    .join(' · ')

  const body = (
    <div
      className={cn(
        'flex gap-3 transition-colors',
        compact ? 'px-3.5 py-3' : 'px-4 py-4',
        unread ? 'bg-sky-500/[0.06]' : '',
        href && 'hover:bg-white/[0.06]',
      )}
    >
      <div
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          unread ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'bg-transparent',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug text-white',
              unread ? 'font-semibold' : 'font-medium text-zinc-200',
              compact && 'line-clamp-2',
              !compact && 'line-clamp-2 sm:line-clamp-none',
            )}
          >
            {title}
          </p>
          {href && (
            <ExternalLink
              size={14}
              className="mt-0.5 shrink-0 text-zinc-600"
              aria-hidden
            />
          )}
        </div>

        {meta && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
            {price && <span>{price}</span>}
            {area && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} className="opacity-70" />
                {area}
              </span>
            )}
            {bedrooms != null && (
              <span className="inline-flex items-center gap-0.5">
                <BedDouble size={11} className="opacity-70" />
                {bedrooms} BR
              </span>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span>
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
          {notification.whatsapp_sent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400/90">
              <Send size={10} />
              Telegram
            </span>
          )}
          {!unread && (
            <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-zinc-600">
              Read
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (!href) return body

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block outline-none focus-visible:bg-white/[0.06]"
    >
      {body}
    </a>
  )
}
