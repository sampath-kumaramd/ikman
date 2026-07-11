'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useClerk } from '@clerk/nextjs'
import { CriteriaForm } from '@/components/CriteriaForm'
import { TelegramConnect } from '@/components/TelegramConnect'
import { track } from '@/lib/analytics'
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
  const router = useRouter()
  const { signOut } = useClerk()
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
        track('settings_saved', {
          areas: criteria.areas.length,
          notifications_enabled: notificationsEnabled,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 size={20} className="mr-2 animate-spin" /> Loading settings…
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="w-full space-y-6">
      {/* Wide two-column layout on large screens — matches dashboard max-w-7xl */}
      <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left: search criteria (full height of sections) */}
        <div className="min-w-0 space-y-6">
          <CriteriaForm value={criteria} onChange={setCriteria} />
        </div>

        {/* Right: notifications + danger zone stacked */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="dark:rounded-2xl dark:border-white/10 dark:border-t-white/20 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="dark:font-display dark:text-white">
                Telegram Notifications
              </CardTitle>
              <CardDescription className="dark:text-zinc-400">
                Get alerted the moment a new listing matches your criteria.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Enable notifications</p>
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-zinc-500">
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

          <Card className="border-red-500/20 dark:rounded-2xl dark:border-red-500/20 dark:border-t-red-400/20 dark:bg-red-500/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-red-300 dark:font-display">Danger zone</CardTitle>
              <CardDescription className="dark:text-zinc-400">
                Permanently delete your account, search criteria, notifications, and Telegram link.
                This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deleteError && (
                <p role="alert" className="text-sm text-red-300">{deleteError}</p>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={async () => {
                  const ok = window.confirm(
                    'Delete your account permanently? You will need to sign up again to use the tracker.',
                  )
                  if (!ok) return
                  setDeleting(true)
                  setDeleteError(null)
                  try {
                    const res = await fetch('/api/account', { method: 'DELETE' })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error ?? 'Could not delete account')
                    track('account_deleted')
                    await signOut({ redirectUrl: '/' })
                    router.push('/')
                    router.refresh()
                  } catch (err) {
                    setDeleteError((err as Error).message)
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-width save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0f1a]/85 px-4 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:px-5">
        <p className="text-sm text-zinc-500">
          {saved ? (
            <span className="text-emerald-400">Settings saved.</span>
          ) : (
            'Changes apply to new scrapes and your dashboard filters.'
          )}
        </p>
        <Button
          type="submit"
          disabled={saving}
          size="lg"
          className="w-full sm:w-auto dark:bg-sky-500 dark:text-white dark:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] dark:hover:bg-sky-400"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
