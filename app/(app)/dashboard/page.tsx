'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Loader2, Home, Building2, LayoutGrid } from 'lucide-react'
import { ListingCard } from '@/components/ListingCard'
import { FilterBar } from '@/components/FilterBar'
import { ScrapeStatusBanner } from '@/components/ScrapeStatusBanner'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import type { Listing, ListingFilters } from '@/lib/types'

const DEFAULT_FILTERS: ListingFilters = {
  sort: 'date_desc',
  page: 1,
  limit: 20,
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

  useEffect(() => {
    fetch('/api/listings?is_new=true&limit=1')
      .then((r) => r.json())
      .then((d) => setNewCount(d.total ?? 0))
      .catch(() => {})
  }, [listings])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => { if (s.areas) setAreas(s.areas) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchListings(filters), 0)
    return () => clearTimeout(t)
  }, [filters, fetchListings])

  async function triggerScrape() {
    setTriggering(true)
    setTriggerMsg('')
    try {
      const res = await fetch('/api/trigger-scrape', { method: 'POST' })
      const data = await res.json()
      if (res.ok) track('scrape_triggered', { source: 'dashboard' })
      setTriggerMsg(res.ok ? '✓ Scrape triggered! Results appear in ~2 minutes.' : `Error: ${data.error}`)
    } catch {
      setTriggerMsg('Failed to trigger scrape.')
    } finally {
      setTriggering(false)
      setTimeout(() => setTriggerMsg(''), 8000)
    }
  }

  const totalPages = Math.ceil(total / (filters.limit ?? 20))

  const stats = [
    { label: 'Total listings', value: total,        icon: <LayoutGrid size={15} />, chip: 'bg-sky-500/15 text-sky-300' },
    { label: 'New',            value: newCount,     icon: <Home size={15} />,       chip: 'bg-orange-500/15 text-orange-300' },
    { label: 'Areas tracked',  value: areas.length, icon: <Building2 size={15} />,  chip: 'bg-emerald-500/15 text-emerald-300' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats row + Run Now */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Stat cards */}
        <div className="flex gap-3 flex-wrap flex-1">
          {stats.map((s) => (
            <div key={s.label} className="glass-subtle flex flex-1 min-w-[110px] items-center gap-3 rounded-2xl px-4 py-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${s.chip}`}>
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-bold leading-none text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Run Now */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={triggerScrape}
            disabled={triggering}
            className="flex h-9 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {triggering
              ? <Loader2 size={15} className="animate-spin" />
              : <RefreshCw size={15} />
            }
            Run Now
          </button>
          {triggerMsg && (
            <span className="text-xs text-zinc-500 text-right max-w-xs">{triggerMsg}</span>
          )}
        </div>
      </div>

      {/* Live scrape status */}
      <ScrapeStatusBanner onRunCompleted={() => fetchListings(filters)} />

      {/* Filters */}
      <FilterBar filters={filters} areas={areas} onChange={setFilters} />

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-zinc-700" />
        </div>
      ) : listings.length === 0 ? (
        <div className="glass mx-auto max-w-md space-y-2 rounded-3xl py-16 text-center">
          <div className="text-4xl">🏚️</div>
          <p className="font-medium text-white">No listings found</p>
          <p className="text-sm text-zinc-400">Try adjusting your filters or run a scrape.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onToggleViewed={(id, isNew) => {
                setListings((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, is_new: isNew } : x)),
                )
                setNewCount((n) => isNew ? n + 1 : Math.max(0, n - 1))
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
            disabled={(filters.page ?? 1) <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-500">
            Page {filters.page ?? 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
            onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
            disabled={(filters.page ?? 1) >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
