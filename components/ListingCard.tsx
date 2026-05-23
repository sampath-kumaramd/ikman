'use client'

import { useState } from 'react'
import { ExternalLink, Phone, MapPin, BedDouble, Calendar, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Listing } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  apartment: 'bg-blue-100 text-blue-800',
  house:     'bg-green-100 text-green-800',
  annex:     'bg-purple-100 text-purple-800',
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false)
  const photo = !imgError && listing.photos?.[0] ? listing.photos[0] : null

  const postedAgo = listing.posted_at
    ? formatDistanceToNow(new Date(listing.posted_at), { addSuffix: true })
    : listing.created_at
    ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })
    : null

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* NEW badge */}
      {listing.is_new && (
        <span className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          NEW
        </span>
      )}

      {/* Photo */}
      <div className="h-44 bg-gray-100 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title ?? 'listing photo'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BedDouble size={40} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Price + type badge */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-xl font-bold text-gray-900">
            {listing.price ? `Rs. ${listing.price.toLocaleString()}` : 'Price on request'}
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </span>
          {listing.listing_type && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${
                TYPE_COLORS[listing.listing_type] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {listing.listing_type}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {listing.title ?? 'Untitled listing'}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {listing.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {listing.location}
            </span>
          )}
          {listing.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble size={12} /> {listing.bedrooms} BR
            </span>
          )}
          {postedAgo && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {postedAgo}
            </span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {listing.contact && (
            <a
              href={`tel:${listing.contact}`}
              className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Phone size={12} /> {listing.contact}
            </a>
          )}
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors ml-auto"
          >
            View on ikman <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
