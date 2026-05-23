'use client'

import { useState } from 'react'
import { ExternalLink, Phone, MapPin, BedDouble, Calendar, Eye, EyeOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/types'

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  apartment: 'default',
  house:     'secondary',
  annex:     'outline',
}

interface ListingCardProps {
  listing: Listing
  onToggleViewed?: (id: string, isNew: boolean) => void
}

export function ListingCard({ listing, onToggleViewed }: ListingCardProps) {
  const [imgError, setImgError] = useState(false)
  const [isNew, setIsNew]       = useState(listing.is_new)
  const [toggling, setToggling] = useState(false)

  const photo = !imgError && listing.photos?.[0] ? listing.photos[0] : null

  const postedAgo = listing.posted_at
    ? formatDistanceToNow(new Date(listing.posted_at), { addSuffix: true })
    : listing.created_at
    ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })
    : null

  async function markViewed() {
    if (!isNew) return
    setIsNew(false)
    onToggleViewed?.(listing.id, false)
    await fetch('/api/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listing.id, is_new: false }),
    })
  }

  async function toggleNew() {
    setToggling(true)
    const next = !isNew
    setIsNew(next)
    onToggleViewed?.(listing.id, next)
    await fetch('/api/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listing.id, is_new: next }),
    })
    setToggling(false)
  }

  return (
    <Card className={cn(
      'overflow-hidden gap-0 py-0 hover:shadow-lg transition-all duration-200',
      !isNew && 'opacity-75',
    )}>
      {/* Photo */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {isNew && (
          <Badge className="absolute top-3 left-3 z-10 bg-orange-500 text-white hover:bg-orange-500">
            NEW
          </Badge>
        )}
        {!isNew && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 z-10 text-muted-foreground"
          >
            Viewed
          </Badge>
        )}
        {photo ? (
          <img
            src={photo}
            alt={listing.title ?? 'listing photo'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <BedDouble size={40} />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Price + type badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xl font-bold text-foreground">
              {listing.price ? `Rs. ${listing.price.toLocaleString()}` : 'Price on request'}
            </span>
            {listing.price && (
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            )}
          </div>
          {listing.listing_type && (
            <Badge
              variant={TYPE_VARIANTS[listing.listing_type] ?? 'outline'}
              className="capitalize shrink-0 mt-0.5"
            >
              {listing.listing_type}
            </Badge>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {listing.title ?? 'Untitled listing'}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {listing.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {listing.location}
            </span>
          )}
          {listing.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble size={11} /> {listing.bedrooms} BR
            </span>
          )}
          {postedAgo && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {postedAgo}
            </span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {listing.contact && (
            <a
              href={`tel:${listing.contact}`}
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'text-green-700 bg-green-50 hover:bg-green-100')}
            >
              <Phone size={12} /> {listing.contact}
            </a>
          )}

          {/* Viewed / Unviewed toggle */}
          <Button
            variant="ghost"
            size="sm"
            disabled={toggling}
            onClick={toggleNew}
            className="text-muted-foreground hover:text-foreground"
            title={isNew ? 'Mark as viewed' : 'Mark as new'}
          >
            {isNew
              ? <><Eye size={12} /> Mark viewed</>
              : <><EyeOff size={12} /> Mark new</>
            }
          </Button>

          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markViewed}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'ml-auto')}
          >
            View on ikman <ExternalLink size={12} />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
