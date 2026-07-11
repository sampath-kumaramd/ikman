'use client'

import { useMemo, useState } from 'react'
import { X, Plus, Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  AVAILABLE_AREAS,
  DISTRICTS,
  AREAS_BY_DISTRICT,
  IKMAN_AREAS,
  LOCATIONS_META,
  MAX_AREAS_PER_USER,
  POPULAR_AREAS,
  isSupportedArea,
  normalizeAreaName,
} from '@/lib/areas'
import { cn } from '@/lib/utils'
import type { ListingType, SearchCriteria } from '@/lib/types'

export { AVAILABLE_AREAS }

const LISTING_TYPE_OPTIONS: ListingType[] = ['apartment', 'annex', 'house']

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        'dark:rounded-2xl dark:border-white/10 dark:border-t-white/20 dark:bg-white/[0.04]',
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-xl',
      )}
    >
      <header className="px-6 pt-6">
        <h3 className="font-semibold leading-none dark:font-display dark:text-white">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground dark:text-zinc-400">{description}</p>
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

function chipClasses(selected: boolean) {
  return selected
    ? 'dark:bg-sky-500 dark:text-white dark:hover:bg-sky-400 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
    : 'dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
}

interface CriteriaFormProps {
  value: SearchCriteria
  onChange: (value: SearchCriteria) => void
}

/** Controlled editor for search criteria — shared by onboarding and settings. */
export function CriteriaForm({ value, onChange }: CriteriaFormProps) {
  const [query, setQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const atLimit = value.areas.length >= MAX_AREAS_PER_USER

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = IKMAN_AREAS

    if (districtFilter !== 'all') {
      list = list.filter((a) => a.district === districtFilter)
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.district && a.district.toLowerCase().includes(q)) ||
          a.slug.includes(q),
      )
    }

    // When not searching, show first chunk of current district / all
    if (!q && districtFilter === 'all') {
      return list.slice(0, 48)
    }
    return list.slice(0, 120)
  }, [query, districtFilter])

  const canAddCustom =
    query.trim().length >= 2 &&
    isSupportedArea(query) &&
    !value.areas.some((a) => a.toLowerCase() === query.trim().toLowerCase()) &&
    !AVAILABLE_AREAS.some((a) => a.toLowerCase() === query.trim().toLowerCase()) &&
    !atLimit

  function addArea(area: string) {
    if (atLimit) return
    const name = normalizeAreaName(area)
    if (!isSupportedArea(name)) return
    if (value.areas.some((a) => a.toLowerCase() === name.toLowerCase())) return
    onChange({ ...value, areas: [...value.areas, name] })
    setQuery('')
  }

  function removeArea(area: string) {
    onChange({
      ...value,
      areas: value.areas.filter((a) => a !== area),
    })
  }

  function togglePopular(area: string) {
    if (value.areas.includes(area)) removeArea(area)
    else addArea(area)
  }

  function toggleType(type: ListingType) {
    onChange({
      ...value,
      listing_types: value.listing_types.includes(type)
        ? value.listing_types.filter((t) => t !== type)
        : [...value.listing_types, type],
    })
  }

  function selectWholeDistrict(district: string) {
    const names = AREAS_BY_DISTRICT[district] ?? []
    const next = [...value.areas]
    const seen = new Set(next.map((a) => a.toLowerCase()))
    for (const name of names) {
      if (next.length >= MAX_AREAS_PER_USER) break
      if (seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      next.push(name)
    }
    onChange({ ...value, areas: next })
  }

  return (
    <div className="space-y-6">
      <Section
        title="Search Areas"
        description={`All ${LOCATIONS_META.count} locations from ikman.lk — up to ${MAX_AREAS_PER_USER} per account.`}
      >
        <div className="space-y-5">
          {/* Selected */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Selected ({value.areas.length}/{MAX_AREAS_PER_USER})
              </p>
              {value.areas.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                  onClick={() => onChange({ ...value, areas: [] })}
                >
                  Clear all
                </button>
              )}
            </div>
            {value.areas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500">
                No areas yet — search any town on ikman, or pick from popular / districts.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {value.areas.map((area) => (
                  <Badge
                    key={area}
                    variant="secondary"
                    className="gap-1.5 py-1 pl-2.5 pr-1 text-sm dark:bg-sky-500/20 dark:text-sky-100"
                  >
                    <MapPin size={12} className="text-sky-400" />
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area)}
                      className="rounded-full p-0.5 hover:bg-white/10"
                      aria-label={`Remove ${area}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Search + district filter */}
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <Input
                  placeholder="Search all ikman locations… e.g. Homagama, Jaffna, Ella"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (canAddCustom) addArea(query)
                      else if (filtered[0] && !atLimit) addArea(filtered[0].name)
                    }
                  }}
                  disabled={atLimit}
                  className="pl-10 dark:border-white/10 dark:bg-white/[0.04] dark:placeholder:text-zinc-600"
                />
              </div>
              <Select
                value={districtFilter}
                onValueChange={(v) => setDistrictFilter(v ?? 'all')}
              >
                <SelectTrigger className="w-full sm:w-48 dark:border-white/10 dark:bg-white/[0.04]">
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All districts</SelectItem>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {districtFilter !== 'all' && !atLimit && (
              <button
                type="button"
                className="text-xs font-medium text-sky-400 hover:text-sky-300"
                onClick={() => selectWholeDistrict(districtFilter)}
              >
                Add all locations in {districtFilter}
              </button>
            )}

            {canAddCustom && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('gap-1.5', chipClasses(false))}
                onClick={() => addArea(query)}
              >
                <Plus size={14} />
                Add “{normalizeAreaName(query)}”
              </Button>
            )}

            {atLimit && (
              <p className="text-xs text-amber-400/90">
                Maximum {MAX_AREAS_PER_USER} areas. Remove one to add another.
              </p>
            )}

            {/* Results list */}
            {(query.trim().length > 0 || districtFilter !== 'all') && !atLimit && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
                {filtered.length === 0 && !canAddCustom ? (
                  <p className="px-2 py-3 text-sm text-zinc-500">
                    No match in ikman locations. Check spelling or pick another district.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {filtered.map((area) => {
                      const selected = value.areas.some(
                        (a) => a.toLowerCase() === area.name.toLowerCase(),
                      )
                      return (
                        <Button
                          key={area.slug}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className={cn('h-8 text-xs', chipClasses(selected))}
                          title={area.district ? `${area.name} · ${area.district}` : area.name}
                          onClick={() =>
                            selected ? removeArea(area.name) : addArea(area.name)
                          }
                          disabled={!selected && atLimit}
                        >
                          {area.name}
                        </Button>
                      )
                    })}
                  </div>
                )}
                {filtered.length >= 120 && (
                  <p className="mt-2 px-1 text-[11px] text-zinc-600">
                    Showing first 120 matches — type more to narrow.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Popular when idle */}
          {!query.trim() && districtFilter === 'all' && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Popular
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AREAS.map((area) => {
                  const selected = value.areas.includes(area)
                  return (
                    <Button
                      key={area}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className={chipClasses(selected)}
                      onClick={() => togglePopular(area)}
                      disabled={!selected && atLimit}
                    >
                      {area}
                    </Button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                {LOCATIONS_META.count} places from ikman.lk · browse by district or search above
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Property Types"
        description="Choose which property types to include in results."
      >
        <div className="flex flex-wrap gap-2">
          {LISTING_TYPE_OPTIONS.map((type) => {
            const selected = value.listing_types.includes(type)
            return (
              <Button
                key={type}
                type="button"
                variant={selected ? 'default' : 'outline'}
                size="sm"
                className={cn('capitalize', chipClasses(selected))}
                onClick={() => toggleType(type)}
              >
                {type}
              </Button>
            )
          })}
        </div>
      </Section>

      <Section
        title="Price & Bedrooms"
        description="Set your budget and bedroom preferences."
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium dark:text-zinc-300">Max rent</label>
              <span className="text-sm font-bold text-primary dark:text-sky-300">
                Rs. {value.max_price.toLocaleString()}
              </span>
            </div>
            <Slider
              min={10000}
              max={200000}
              step={5000}
              value={[value.max_price]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                onChange({ ...value, max_price: v as number })
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground dark:text-zinc-500">
              <span>Rs. 10,000</span><span>Rs. 200,000</span>
            </div>
          </div>

          <Separator className="dark:bg-white/10" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Min bedrooms</label>
              <Select
                value={String(value.min_bedrooms)}
                onValueChange={(val) => onChange({ ...value, min_bedrooms: Number(val) })}
              >
                <SelectTrigger className="w-full dark:border-white/10 dark:bg-white/[0.04]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Max bedrooms</label>
              <Select
                value={String(value.max_bedrooms)}
                onValueChange={(val) => onChange({ ...value, max_bedrooms: Number(val) })}
              >
                <SelectTrigger className="w-full dark:border-white/10 dark:bg-white/[0.04]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
