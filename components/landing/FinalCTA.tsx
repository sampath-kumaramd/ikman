'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'

export function FinalCTA() {
  const router = useRouter()

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 sm:flex-row sm:items-center sm:px-10 sm:py-12">
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready when the next listing drops
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Create a free account, set your areas, connect Telegram. We handle the rest.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/sign-up')}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Start free
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </Reveal>
    </section>
  )
}
