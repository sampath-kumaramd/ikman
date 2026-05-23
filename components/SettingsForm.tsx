'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
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

export function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [customArea, setCustomArea] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
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
    setSettings((s) => ({
      ...s,
      areas: s.areas.includes(area)
        ? s.areas.filter((a) => a !== area)
        : [...s.areas, area],
    }))
  }

  function toggleType(type: typeof LISTING_TYPE_OPTIONS[number]) {
    setSettings((s) => ({
      ...s,
      listing_types: s.listing_types.includes(type)
        ? s.listing_types.filter((t) => t !== type)
        : [...s.listing_types, type],
    }))
  }

  function addCustomArea() {
    const trimmed = customArea.trim()
    if (trimmed && !settings.areas.includes(trimmed)) {
      setSettings((s) => ({ ...s, areas: [...s.areas, trimmed] }))
    }
    setCustomArea('')
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading settings…</div>

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
      {/* Areas */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Search Areas</h2>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings.areas.includes(area)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        {/* Custom area */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom area…"
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomArea())}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="button"
            onClick={addCustomArea}
            className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
        {/* Custom areas chips */}
        {settings.areas.filter((a) => !AVAILABLE_AREAS.includes(a)).map((area) => (
          <span key={area} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
            {area}
            <button type="button" onClick={() => toggleArea(area)} className="ml-1 text-blue-400 hover:text-blue-700">×</button>
          </span>
        ))}
      </section>

      {/* Listing types */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Property Types</h2>
        <div className="flex gap-3">
          {LISTING_TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                settings.listing_types.includes(type)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* Price & Bedrooms */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Price & Bedrooms</h2>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">
            Max rent: <strong>Rs. {settings.max_price.toLocaleString()}</strong>
          </label>
          <input
            type="range" min={10000} max={200000} step={5000}
            value={settings.max_price}
            onChange={(e) => setSettings((s) => ({ ...s, max_price: Number(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Rs. 10,000</span><span>Rs. 200,000</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Min bedrooms</label>
            <select
              value={settings.min_bedrooms}
              onChange={(e) => setSettings((s) => ({ ...s, min_bedrooms: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Max bedrooms</label>
            <select
              value={settings.max_bedrooms}
              onChange={(e) => setSettings((s) => ({ ...s, max_bedrooms: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Notifications</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setSettings((s) => ({ ...s, notifications_enabled: !s.notifications_enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.notifications_enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.notifications_enabled ? 'translate-x-5' : ''
              }`}
            />
          </div>
          <span className="text-sm text-gray-700">Enable notifications</span>
        </label>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">WhatsApp number</label>
          <input
            type="tel"
            placeholder="+94760937443"
            value={settings.whatsapp_number}
            onChange={(e) => setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p className="text-xs text-gray-400">Format: +94XXXXXXXXX</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">
            Scrape interval: <strong>{settings.scrape_interval_minutes} minutes</strong>
          </label>
          <input
            type="range" min={15} max={240} step={15}
            value={settings.scrape_interval_minutes}
            onChange={(e) => setSettings((s) => ({ ...s, scrape_interval_minutes: Number(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>15 min</span><span>4 hours</span>
          </div>
        </div>
      </section>

      {/* Save */}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save settings'}
      </button>
    </form>
  )
}
