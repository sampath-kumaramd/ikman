'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw } from 'lucide-react'
import type { ListingFilters } from '@/lib/types'

interface FilterBarProps {
  filters: ListingFilters
  areas: string[]
  onChange: (filters: ListingFilters) => void
}

const LISTING_TYPES = ['apartment', 'annex', 'house'] as const

const SORT_OPTIONS = [
  { value: 'date_desc',  label: 'Newest first' },
  { value: 'date_asc',   label: 'Oldest first' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
] as const

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 bedroom'  },
  { value: '2', label: '2 bedrooms' },
  { value: '3', label: '3 bedrooms' },
  { value: '4', label: '4+ bedrooms' },
] as const

const STATUS_OPTIONS = [
  { value: 'all',    label: 'All listings' },
  { value: 'new',    label: 'New only'     },
  { value: 'viewed', label: 'Viewed only'  },
] as const

const DEFAULT_MIN_PRICE = 10000
const DEFAULT_MAX_PRICE = 150000

const DEFAULT_FILTERS: ListingFilters = {
  sort: 'date_desc',
  page: 1,
  limit: 20,
}

function statusFromFilters(filters: ListingFilters): string {
  if (filters.is_new === true)  return 'new'
  if (filters.is_new === false) return 'viewed'
  return 'all'
}

function isNewFromStatus(status: string): boolean | undefined {
  if (status === 'new')    return true
  if (status === 'viewed') return false
  return undefined
}

export function FilterBar({ filters, areas, onChange }: FilterBarProps) {
  const set = (patch: Partial<ListingFilters>) =>
    onChange({ ...filters, ...patch, page: 1 })

  const minPrice = filters.min_price ?? DEFAULT_MIN_PRICE
  const maxPrice = filters.max_price ?? DEFAULT_MAX_PRICE

  const hasActiveFilters =
    !!filters.area ||
    !!filters.listing_type ||
    !!filters.min_bedrooms ||
    filters.is_new !== undefined ||
    (filters.min_price ?? DEFAULT_MIN_PRICE) > DEFAULT_MIN_PRICE ||
    (filters.max_price ?? DEFAULT_MAX_PRICE) < DEFAULT_MAX_PRICE

  return (
    <div className="glass rounded-2xl p-4 space-y-5">

      {/* ── Row 1: dropdowns ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">

        {/* Area */}
        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Area</label>
          <Select
            value={filters.area ?? ''}
            onValueChange={(val) => set({ area: val || undefined })}
          >
            <SelectTrigger className="w-full h-9 border-white/10 bg-white/[0.04]">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5 min-w-[130px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={filters.listing_type ?? ''}
            onValueChange={(val) => set({ listing_type: val || undefined })}
          >
            <SelectTrigger className="w-full h-9 border-white/10 bg-white/[0.04]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {LISTING_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms */}
        <div className="flex flex-col gap-1.5 min-w-[130px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
          <Select
            value={filters.min_bedrooms ? String(filters.min_bedrooms) : ''}
            onValueChange={(val) => {
              if (!val) {
                set({ min_bedrooms: undefined, max_bedrooms: undefined })
              } else {
                const n = Number(val)
                // 4 means 4+ — set min to 4, no max cap
                set({ min_bedrooms: n, max_bedrooms: n === 4 ? undefined : n })
              }
            }}
          >
            <SelectTrigger className="w-full h-9 border-white/10 bg-white/[0.04]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              {BEDROOM_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status (All / New / Viewed) */}
        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={statusFromFilters(filters)}
            onValueChange={(val) => set({ is_new: isNewFromStatus(val ?? 'all') })}
          >
            <SelectTrigger className="w-full h-9 border-white/10 bg-white/[0.04]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5 min-w-[170px] flex-1 sm:flex-none sm:ml-auto">
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <Select
            value={filters.sort ?? 'date_desc'}
            onValueChange={(val) => set({ sort: val as ListingFilters['sort'] })}
          >
            <SelectTrigger className="w-full h-9 border-white/10 bg-white/[0.04]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Row 2: price range slider ──────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">Price range</label>
          <span className="text-xs font-semibold text-sky-300">
            Rs. {minPrice.toLocaleString()} — Rs. {maxPrice.toLocaleString()}
          </span>
        </div>
        <Slider
          min={DEFAULT_MIN_PRICE}
          max={DEFAULT_MAX_PRICE}
          step={5000}
          value={[minPrice, maxPrice]}
          onValueChange={(vals) => {
            const [lo, hi] = Array.isArray(vals) ? vals : [vals, vals]
            set({
              min_price: (lo as number) <= DEFAULT_MIN_PRICE ? undefined : lo as number,
              max_price: (hi as number) >= DEFAULT_MAX_PRICE ? undefined : hi as number,
            })
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Rs. 10,000</span>
          <span>Rs. 150,000</span>
        </div>
      </div>

      {/* ── Row 3: Reset ───────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            <RotateCcw size={11} />
            Reset filters
          </Button>
        </div>
      )}
    </div>
  )
}
