'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Loader2, Send } from 'lucide-react'
import { CriteriaForm } from '@/components/CriteriaForm'
import { TelegramConnect } from '@/components/TelegramConnect'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { SearchCriteria } from '@/lib/types'

const DEFAULT_CRITERIA: SearchCriteria = {
  areas: [],
  listing_types: [],
  max_price: 75000,
  min_bedrooms: 1,
  max_bedrooms: 2,
}

const STEPS = [
  { id: 1, label: 'Your requirements' },
  { id: 2, label: 'Telegram alerts', hint: 'optional' },
] as const

export function OnboardingWizard({ telegramConnected }: { telegramConnected: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA)
  const [connected, setConnected] = useState(telegramConnected)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criteriaValid = criteria.areas.length > 0 && criteria.listing_types.length > 0

  // Restore anything saved before a refresh / earlier visit
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.areas) && d.areas.length) {
          setCriteria({
            areas: d.areas,
            listing_types: Array.isArray(d.listing_types)
              ? d.listing_types
              : DEFAULT_CRITERIA.listing_types,
            max_price: d.max_price || DEFAULT_CRITERIA.max_price,
            min_bedrooms: d.min_bedrooms || DEFAULT_CRITERIA.min_bedrooms,
            max_bedrooms: d.max_bedrooms || DEFAULT_CRITERIA.max_bedrooms,
          })
        }
      })
      .catch(() => {})
  }, [])

  async function saveCriteria() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Could not save your search criteria')
      }
      track('onboarding_criteria_saved', {
        areas: criteria.areas.length,
        listing_types: criteria.listing_types.length,
        max_price: criteria.max_price,
      })
      setStep(2)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not complete setup')
      track('onboarding_completed', { telegram_connected: connected })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="text-4xl">🏠</div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Let&apos;s set up your tracker
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-400">
          Tell us what you&apos;re looking for — we&apos;ll watch ikman.lk for you
          around the clock.
        </p>

        {/* Progress stepper */}
        <div className="glass-subtle mx-auto mt-2 inline-flex items-center gap-3 rounded-full px-4 py-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  className={cn(
                    'h-px w-8 transition-colors',
                    step >= s.id ? 'bg-sky-400/60' : 'bg-white/10',
                  )}
                />
              )}
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                    step > s.id
                      ? 'bg-emerald-500/90 text-white'
                      : step === s.id
                        ? 'bg-sky-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                        : 'bg-white/[0.06] text-zinc-500',
                  )}
                >
                  {step > s.id ? <Check size={12} /> : s.id}
                </span>
                <span
                  className={cn(
                    'text-xs transition-colors',
                    step >= s.id ? 'font-medium text-white' : 'text-zinc-500',
                  )}
                >
                  {s.label}
                </span>
                {'hint' in s && s.hint && (
                  <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {s.hint}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            <CriteriaForm value={criteria} onChange={setCriteria} />

            {!criteriaValid && (
              <p className="text-center text-sm text-zinc-500">
                Pick at least one area and one property type to continue.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-center text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!criteriaValid || busy}
              onClick={saveCriteria}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_45%)]"
              />
              <div className="relative space-y-5">
                <div className="flex items-start gap-3">
                  <span className="glass-subtle flex size-10 shrink-0 items-center justify-center rounded-xl text-sky-300">
                    <Send size={17} />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">
                      Connect Telegram
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      Recommended — alerts land in your chat seconds after a
                      match. You can also skip this and connect anytime from
                      Settings.
                    </p>
                  </div>
                </div>

                <TelegramConnect onStatusChange={setConnected} />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-center text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="glass-subtle flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={finish}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : (
                  <>
                    <Check size={16} />
                    {connected ? 'Finish setup' : 'Finish — connect later'}
                  </>
                )}
              </button>
            </div>

            {!connected && (
              <p className="text-center text-xs text-zinc-500">
                No Telegram? New matches still show up on your dashboard.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
