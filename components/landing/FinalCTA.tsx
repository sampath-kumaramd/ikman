'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'

export function FinalCTA() {
  const router = useRouter()

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <Reveal>
        <div className="glass flex flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl px-6 py-10 sm:flex-row sm:items-center sm:px-10 sm:py-12">
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready when the next listing drops
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Create a free account, set your areas, connect Telegram. We check ikman every 10 minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/sign-up')}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-sky-500/90 px-7 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400"
          >
            Start free
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </Reveal>
    </section>
  )
}
