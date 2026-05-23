'use client'

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
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
      {/* Area */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500">Area</label>
        <select
          value={filters.area ?? ''}
          onChange={(e) => set({ area: e.target.value || undefined })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-xs font-medium text-gray-500">Type</label>
        <select
          value={filters.listing_type ?? ''}
          onChange={(e) => set({ listing_type: e.target.value || undefined })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All types</option>
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label className="text-xs font-medium text-gray-500">Bedrooms</label>
        <select
          value={filters.min_bedrooms ?? ''}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : undefined
            set({ min_bedrooms: v, max_bedrooms: v })
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Any</option>
          <option value="1">1 bedroom</option>
          <option value="2">2 bedrooms</option>
        </select>
      </div>

      {/* Max price */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-xs font-medium text-gray-500">
          Max price: Rs. {(filters.max_price ?? 75000).toLocaleString()}
        </label>
        <input
          type="range"
          min={10000}
          max={150000}
          step={5000}
          value={filters.max_price ?? 75000}
          onChange={(e) => set({ max_price: Number(e.target.value) })}
          className="accent-blue-600"
        />
      </div>

      {/* New only */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-1">
        <input
          type="checkbox"
          checked={filters.is_new === true}
          onChange={(e) => set({ is_new: e.target.checked ? true : undefined })}
          className="accent-orange-500 w-4 h-4"
        />
        New only
      </label>

      {/* Sort */}
      <div className="flex flex-col gap-1 min-w-[170px] ml-auto">
        <label className="text-xs font-medium text-gray-500">Sort by</label>
        <select
          value={filters.sort ?? 'date_desc'}
          onChange={(e) => set({ sort: e.target.value as ListingFilters['sort'] })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
