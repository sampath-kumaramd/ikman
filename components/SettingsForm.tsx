'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CriteriaForm } from '@/components/CriteriaForm'
import { TelegramConnect } from '@/components/TelegramConnect'
import type { SearchCriteria, SettingsResponse } from '@/lib/types'

const DEFAULT_CRITERIA: SearchCriteria = {
  areas: [],
  listing_types: ['apartment', 'annex', 'house'],
  max_price: 75000,
  min_bedrooms: 1,
  max_bedrooms: 2,
}

function normalizeCriteria(data: unknown): SearchCriteria {
  if (!data || typeof data !== 'object' || 'error' in data) return DEFAULT_CRITERIA
  const d = data as Partial<SettingsResponse>
  return {
    areas: Array.isArray(d.areas) ? d.areas : DEFAULT_CRITERIA.areas,
    listing_types: Array.isArray(d.listing_types) ? d.listing_types : DEFAULT_CRITERIA.listing_types,
    max_price: Number(d.max_price) || DEFAULT_CRITERIA.max_price,
    min_bedrooms: Number(d.min_bedrooms) || DEFAULT_CRITERIA.min_bedrooms,
    max_bedrooms: Number(d.max_bedrooms) || DEFAULT_CRITERIA.max_bedrooms,
  }
}

export function SettingsForm() {
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setCriteria(normalizeCriteria(data))
        if (typeof data?.notifications_enabled === 'boolean') {
          setNotificationsEnabled(data.notifications_enabled)
        }
      })
      .catch(() => setCriteria(DEFAULT_CRITERIA))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...criteria, notifications_enabled: notificationsEnabled }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
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
      <CriteriaForm value={criteria} onChange={setCriteria} />

      {/* Notifications */}
      <Card className="dark:rounded-2xl dark:border-white/10 dark:border-t-white/20 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="dark:font-display dark:text-white">Telegram Notifications</CardTitle>
          <CardDescription className="dark:text-zinc-400">Get alerted the moment a new listing matches your criteria.</CardDescription>
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
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <Separator className="dark:bg-white/10" />

          <TelegramConnect manage />
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        type="submit"
        disabled={saving}
        size="lg"
        className="w-full sm:w-auto dark:bg-sky-500 dark:text-white dark:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] dark:hover:bg-sky-400"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save settings'}
      </Button>
    </form>
  )
}
