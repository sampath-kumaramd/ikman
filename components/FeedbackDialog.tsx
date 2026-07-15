'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { Loader2, MessageSquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'feature', label: 'Feature request' },
  { value: 'bug', label: 'Bug report' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
] as const

export function FeedbackDialog() {
  const pathname = usePathname()
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('feature')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function reset() {
    setCategory('feature')
    setMessage('')
    setError(null)
    setDone(false)
    setBusy(false)
  }

  function close() {
    setOpen(false)
    setTimeout(reset, 200)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          page: pathname || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not send feedback')
      track('feedback_submitted', { category, page: pathname })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className={cn(
              'fixed inset-0 z-[100] flex',
              // Mobile: pin to bottom; desktop: center
              'items-end justify-center sm:items-center',
              'p-0 sm:p-6',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-label="Close"
              onClick={close}
            />

            <div
              className={cn(
                'relative z-10 flex w-full flex-col overflow-hidden',
                'border border-white/10 bg-[#0c1018] shadow-2xl',
                // Mobile bottom sheet
                'max-h-[min(92dvh,40rem)] rounded-t-2xl border-b-0',
                'pb-[env(safe-area-inset-bottom)]',
                // Desktop card
                'sm:max-w-md sm:rounded-2xl sm:border-b sm:pb-0',
              )}
            >
              {/* Mobile drag affordance */}
              <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5 sm:py-4">
                <h2
                  id={titleId}
                  className="font-display text-base font-semibold text-white"
                >
                  Send feedback
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white sm:p-1.5"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {done ? (
                  <div className="space-y-4 px-4 py-8 text-center sm:px-5">
                    <p className="text-sm font-medium text-white">Thanks — we got it.</p>
                    <p className="text-sm text-zinc-400">
                      Your request was saved. We&apos;ll review it when we can.
                    </p>
                    <Button
                      type="button"
                      onClick={close}
                      className="w-full dark:bg-sky-500 dark:hover:bg-sky-400 sm:w-auto"
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-col"
                  >
                    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                      <p className="text-sm text-zinc-400">
                        Feature ideas, bugs, or questions — anything that would make the
                        tracker better.
                      </p>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-zinc-400">Type</span>
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setCategory(c.value)}
                              className={cn(
                                'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                category === c.value
                                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                                  : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]',
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="fb-message"
                          className="text-xs font-medium text-zinc-400"
                        >
                          Message
                        </label>
                        <textarea
                          id="fb-message"
                          required
                          minLength={5}
                          maxLength={2000}
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="What should we build or fix?"
                          className={cn(
                            'w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-base text-white sm:text-sm',
                            'placeholder:text-zinc-600 outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20',
                            'min-h-[7.5rem] max-h-[40dvh]',
                          )}
                        />
                        <p className="text-right text-[11px] text-zinc-600">
                          {message.length}/2000
                        </p>
                      </div>

                      {error && (
                        <p
                          role="alert"
                          className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    {/* Sticky action bar — always visible above keyboard / home indicator */}
                    <div
                      className={cn(
                        'sticky bottom-0 flex shrink-0 gap-2 border-t border-white/[0.06]',
                        'bg-[#0c1018]/95 px-4 py-3 backdrop-blur-md sm:px-5',
                        'pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4',
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={close}
                        disabled={busy}
                        className="min-h-11 flex-1 sm:min-h-9 sm:flex-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={busy || message.trim().length < 5}
                        className="min-h-11 flex-1 gap-2 dark:bg-sky-500 dark:text-white dark:hover:bg-sky-400 sm:min-h-9 sm:flex-none sm:min-w-[6.5rem]"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                        Send
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Feedback"
        className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <MessageSquarePlus size={20} />
      </button>
      {modal}
    </>
  )
}
