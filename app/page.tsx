'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Loader2, Home, Building2, LayoutGrid } from 'lucide-react'
import { ListingCard } from '@/components/ListingCard'
import { FilterBar } from '@/components/FilterBar'
import type { Listing, ListingFilters } from '@/lib/types'

const DEFAULT_FILTERS: ListingFilters = {
  sort: 'date_desc',
  page: 1,
  limit: 20,
}

const STAT_ICONS = {
  total:     <LayoutGrid size={18} className="text-blue-500" />,
  new:       <Home size={18} className="text-orange-500" />,
  areas:     <Building2 size={18} className="text-green-500" />,
}

export default function DashboardPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS)
  const [areas, setAreas] = useState<string[]>(['Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala'])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState('')

  const fetchListings = useCallback(async (f: ListingFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      setListings(data.listings ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch new count (for stats)
  useEffect(() => {
    fetch('/api/listings?is_new=true&limit=1')
      .then((r) => r.json())
      .then((d) => setNewCount(d.total ?? 0))
      .catch(() => {})
  }, [listings])

  // Load areas from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => { if (s.areas) setAreas(s.areas) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchListings(filters)
  }, [filters, fetchListings])

  async function triggerScrape() {
    setTriggering(true)
    setTriggerMsg('')
    try {
      const res = await fetch('/api/trigger-scrape', { method: 'POST' })
      const data = await res.json()
      setTriggerMsg(res.ok ? '✓ Scrape triggered! Results appear in ~2 minutes.' : `Error: ${data.error}`)
    } catch {
      setTriggerMsg('Failed to trigger scrape.')
    } finally {
      setTriggering(false)
      setTimeout(() => setTriggerMsg(''), 8000)
    }
  }

  const totalPages = Math.ceil(total / (filters.limit ?? 20))

  return (
    <div className="space-y-6">
      {/* Stats + Run Now */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-3">
          {[
            { label: 'Total listings', value: total,    icon: STAT_ICONS.total   },
            { label: 'New',            value: newCount,  icon: STAT_ICONS.new     },
            { label: 'Areas',          value: areas.length, icon: STAT_ICONS.areas },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm"
            >
              {s.icon}
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            onClick={triggerScrape}
            disabled={triggering}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {triggering ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Run Now
          </button>
          {triggerMsg && (
            <span className="text-xs text-gray-500 text-right max-w-xs">{triggerMsg}</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} areas={areas} onChange={setFilters} />

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24 text-gray-400 space-y-2">
          <div className="text-4xl">🏚️</div>
          <p className="font-medium">No listings found</p>
          <p className="text-sm">Try adjusting your filters or run a scrape.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
            disabled={(filters.page ?? 1) <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {filters.page ?? 1} of {totalPages}
          </span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
            disabled={(filters.page ?? 1) >= totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
