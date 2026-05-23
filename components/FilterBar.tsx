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

export function FilterBar({ filters, areas, onChange }: FilterBarProps) {
  const set = (patch: Partial<ListingFilters>) =>
    onChange({ ...filters, ...patch, page: 1 })

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Area */}
        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Area</label>
          <Select
            value={filters.area ?? ''}
            onValueChange={(val) => set({ area: val || undefined })}
          >
            <SelectTrigger className="w-full h-9">
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
            <SelectTrigger className="w-full h-9">
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
        <div className="flex flex-col gap-1.5 min-w-[120px] flex-1 sm:flex-none">
          <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
          <Select
            value={filters.min_bedrooms ? String(filters.min_bedrooms) : ''}
            onValueChange={(val) => {
              const v = val ? Number(val) : undefined
              set({ min_bedrooms: v, max_bedrooms: v })
            }}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="1">1 bedroom</SelectItem>
              <SelectItem value="2">2 bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* New only toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Filter</label>
          <Button
            variant={filters.is_new ? 'default' : 'outline'}
            size="sm"
            className="h-9"
            onClick={() => set({ is_new: filters.is_new ? undefined : true })}
          >
            New only
          </Button>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5 min-w-[170px] flex-1 sm:flex-none sm:ml-auto">
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <Select
            value={filters.sort ?? 'date_desc'}
            onValueChange={(val) => set({ sort: val as ListingFilters['sort'] })}
          >
            <SelectTrigger className="w-full h-9">
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

      {/* Max price slider — full width row */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Max price
          </label>
          <span className="text-xs font-semibold text-foreground">
            Rs. {(filters.max_price ?? 75000).toLocaleString()}
          </span>
        </div>
        <Slider
          min={10000}
          max={150000}
          step={5000}
          value={[filters.max_price ?? 75000]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            set({ max_price: v as number })
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Rs. 10,000</span>
          <span>Rs. 150,000</span>
        </div>
      </div>
    </div>
  )
}
