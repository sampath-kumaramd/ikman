'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { ListingType, SearchCriteria } from '@/lib/types'

export const AVAILABLE_AREAS = [
  'Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala',
  'Panadura', 'Piliyandala', 'Maharagama', 'Nugegoda', 'Colombo 06',
]
const LISTING_TYPE_OPTIONS: ListingType[] = ['apartment', 'annex', 'house']

/** Card-like section that stays a plain card in light mode (settings page)
 *  and renders as a frosted glass panel in dark mode (onboarding). */
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

/** Toggle chip — sky pill when selected, frosted outline otherwise (dark). */
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
  const [customArea, setCustomArea] = useState('')

  function toggleArea(area: string) {
    onChange({
      ...value,
      areas: value.areas.includes(area)
        ? value.areas.filter((a) => a !== area)
        : [...value.areas, area],
    })
  }

  function toggleType(type: ListingType) {
    onChange({
      ...value,
      listing_types: value.listing_types.includes(type)
        ? value.listing_types.filter((t) => t !== type)
        : [...value.listing_types, type],
    })
  }

  function addCustomArea() {
    const trimmed = customArea.trim()
    if (trimmed && !value.areas.includes(trimmed)) {
      onChange({ ...value, areas: [...value.areas, trimmed] })
    }
    setCustomArea('')
  }

  return (
    <div className="space-y-6">
      {/* Areas */}
      <Section
        title="Search Areas"
        description="Select the areas you want to track for rental listings."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_AREAS.map((area) => {
              const selected = value.areas.includes(area)
              return (
                <Button
                  key={area}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className={chipClasses(selected)}
                  onClick={() => toggleArea(area)}
                >
                  {area}
                </Button>
              )
            })}
          </div>

          {/* Custom areas */}
          {value.areas.filter((a) => !AVAILABLE_AREAS.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {value.areas.filter((a) => !AVAILABLE_AREAS.includes(a)).map((area) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="gap-1 pr-1 dark:bg-white/[0.08] dark:text-zinc-200"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => toggleArea(area)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X size={10} />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Add custom area…"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomArea())}
              className="flex-1 dark:border-white/10 dark:bg-white/[0.04] dark:placeholder:text-zinc-600"
            />
            <Button
              type="button"
              variant="outline"
              className={chipClasses(false)}
              onClick={addCustomArea}
            >
              <Plus size={15} /> Add
            </Button>
          </div>
        </div>
      </Section>

      {/* Property Types */}
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

      {/* Price & Bedrooms */}
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
