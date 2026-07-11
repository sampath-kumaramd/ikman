'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { AlertsDemo } from './AlertsDemo'

export function Hero() {
  const router = useRouter()

  return (
    <section className="relative border-b border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="text-center lg:text-left">
          <Reveal inView={false}>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
              Live monitoring · Telegram alerts
            </p>
          </Reveal>

          <Reveal inView={false} delay={0.06}>
            <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Be first to the listing.
              <span className="mt-1 block text-zinc-500">
                Before everyone else calls.
              </span>
            </h1>
          </Reveal>

          <Reveal inView={false} delay={0.12}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
              Choose areas, budget and property type. We check ikman.lk on a schedule
              and send matching rentals to your Telegram — so you stop refreshing
              the page at midnight.
            </p>
          </Reveal>

          <Reveal inView={false} delay={0.18}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => router.push('/sign-up')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Start free
                <ArrowRight size={16} strokeWidth={2} />
              </button>
              <Link
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                How it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Free · no card · works with any Telegram account
            </p>
          </Reveal>
        </div>

        <Reveal inView={false} delay={0.2}>
          <AlertsDemo />
        </Reveal>
      </div>
    </section>
  )
}
