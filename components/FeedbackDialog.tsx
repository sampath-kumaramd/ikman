'use client'

import { useEffect, useId, useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('feature')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
    // delay reset so close animation isn't jarring
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={close}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 id={titleId} className="font-display text-base font-semibold text-white">
                Send feedback
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="space-y-4 px-5 py-8 text-center">
                <p className="text-sm font-medium text-white">Thanks — we got it.</p>
                <p className="text-sm text-zinc-400">
                  Your request was saved. We’ll review it when we can.
                </p>
                <Button type="button" onClick={close} className="dark:bg-sky-500 dark:hover:bg-sky-400">
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 px-5 py-5">
                <p className="text-sm text-zinc-400">
                  Feature ideas, bugs, or questions — anything that would make the tracker better.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="fb-category" className="text-xs font-medium text-zinc-400">
                    Type
                  </label>
                  <select
                    id="fb-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white',
                      'outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20',
                    )}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#0c1018]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="fb-message" className="text-xs font-medium text-zinc-400">
                    Message
                  </label>
                  <textarea
                    id="fb-message"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What should we build or fix?"
                    className={cn(
                      'w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white',
                      'placeholder:text-zinc-600 outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20',
                    )}
                  />
                  <p className="text-right text-[11px] text-zinc-600">{message.length}/2000</p>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy || message.trim().length < 5}
                    className="dark:bg-sky-500 dark:text-white dark:hover:bg-sky-400"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    Send
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
