'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { AppSettings } from '@/lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  areas: ['Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala'],
  listing_types: ['apartment', 'annex', 'house'],
  max_price: 75000,
  min_bedrooms: 1,
  max_bedrooms: 2,
  scrape_interval_minutes: 30,
  whatsapp_number: '',
  notifications_enabled: true,
}

const AVAILABLE_AREAS = [
  'Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala',
  'Panadura', 'Piliyandala', 'Maharagama', 'Nugegoda', 'Colombo 06',
]
const LISTING_TYPE_OPTIONS = ['apartment', 'annex', 'house'] as const

function normalizeSettings(data: unknown): AppSettings {
  if (!data || typeof data !== 'object' || 'error' in data) return DEFAULT_SETTINGS
  const d = data as Partial<AppSettings>
  return {
    areas: Array.isArray(d.areas) ? d.areas : DEFAULT_SETTINGS.areas,
    listing_types: Array.isArray(d.listing_types) ? d.listing_types : DEFAULT_SETTINGS.listing_types,
    max_price: Number(d.max_price) || DEFAULT_SETTINGS.max_price,
    min_bedrooms: Number(d.min_bedrooms) || DEFAULT_SETTINGS.min_bedrooms,
    max_bedrooms: Number(d.max_bedrooms) || DEFAULT_SETTINGS.max_bedrooms,
    scrape_interval_minutes:
      Number(d.scrape_interval_minutes) || DEFAULT_SETTINGS.scrape_interval_minutes,
    whatsapp_number: typeof d.whatsapp_number === 'string' ? d.whatsapp_number : '',
    notifications_enabled: d.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
  }
}

export function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [customArea, setCustomArea] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setSettings(normalizeSettings(data)))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  function toggleArea(area: string) {
    setSettings((s) => {
      const areas = s.areas ?? []
      return {
        ...s,
        areas: areas.includes(area)
          ? areas.filter((a) => a !== area)
          : [...areas, area],
      }
    })
  }

  function toggleType(type: typeof LISTING_TYPE_OPTIONS[number]) {
    setSettings((s) => {
      const listing_types = s.listing_types ?? []
      return {
        ...s,
        listing_types: listing_types.includes(type)
          ? listing_types.filter((t) => t !== type)
          : [...listing_types, type],
      }
    })
  }

  function addCustomArea() {
    const trimmed = customArea.trim()
    const areas = settings.areas ?? []
    if (trimmed && !areas.includes(trimmed)) {
      setSettings((s) => ({ ...s, areas: [...(s.areas ?? []), trimmed] }))
    }
    setCustomArea('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading settings…
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Search Areas</CardTitle>
          <CardDescription>Select the areas you want to track for rental listings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_AREAS.map((area) => (
              <Button
                key={area}
                type="button"
                variant={(settings.areas ?? []).includes(area) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArea(area)}
              >
                {area}
              </Button>
            ))}
          </div>

          {/* Custom areas */}
          {(settings.areas ?? []).filter((a) => !AVAILABLE_AREAS.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(settings.areas ?? []).filter((a) => !AVAILABLE_AREAS.includes(a)).map((area) => (
                <Badge key={area} variant="secondary" className="gap-1 pr-1">
                  {area}
                  <button
                    type="button"
                    onClick={() => toggleArea(area)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
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
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addCustomArea}>
              <Plus size={15} /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Types */}
      <Card>
        <CardHeader>
          <CardTitle>Property Types</CardTitle>
          <CardDescription>Choose which property types to include in results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPE_OPTIONS.map((type) => (
              <Button
                key={type}
                type="button"
                variant={(settings.listing_types ?? []).includes(type) ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => toggleType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price & Bedrooms */}
      <Card>
        <CardHeader>
          <CardTitle>Price & Bedrooms</CardTitle>
          <CardDescription>Set your budget and bedroom preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Max rent</label>
              <span className="text-sm font-bold text-primary">
                Rs. {settings.max_price.toLocaleString()}
              </span>
            </div>
            <Slider
              min={10000}
              max={200000}
              step={5000}
              value={[settings.max_price]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                setSettings((s) => ({ ...s, max_price: v as number }))
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rs. 10,000</span><span>Rs. 200,000</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min bedrooms</label>
              <Select
                value={String(settings.min_bedrooms)}
                onValueChange={(val) => setSettings((s) => ({ ...s, min_bedrooms: Number(val) }))}
              >
                <SelectTrigger className="w-full">
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
              <label className="text-sm font-medium">Max bedrooms</label>
              <Select
                value={String(settings.max_bedrooms)}
                onValueChange={(val) => setSettings((s) => ({ ...s, max_bedrooms: Number(val) }))}
              >
                <SelectTrigger className="w-full">
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
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure WhatsApp alerts and scraping frequency.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get alerted when new listings match your criteria
              </p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, notifications_enabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp number</label>
            <Input
              type="tel"
              placeholder="+94760937443"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Format: +94XXXXXXXXX</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Scrape interval</label>
              <span className="text-sm font-bold text-primary">
                {settings.scrape_interval_minutes} min
              </span>
            </div>
            <Slider
              min={15}
              max={240}
              step={15}
              value={[settings.scrape_interval_minutes]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                setSettings((s) => ({ ...s, scrape_interval_minutes: v as number }))
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15 min</span><span>4 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button type="submit" disabled={saving} size="lg" className="w-full sm:w-auto">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save settings'}
      </Button>
    </form>
  )
}
