'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { AlertsDemo } from './AlertsDemo'

export function Hero() {
  const router = useRouter()

  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="text-center lg:text-left">
          <Reveal inView={false}>
            <p className="glass-subtle inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-sky-300">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
              Checks every 10 min · Telegram alerts
            </p>
          </Reveal>

          <Reveal inView={false} delay={0.06}>
            <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Be first to the listing.
              <span className="mt-1 block bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Before everyone else calls.
              </span>
            </h1>
          </Reveal>

          <Reveal inView={false} delay={0.12}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
              Choose areas, budget and property type. We check ikman.lk every 10 minutes
              and send matching rentals to your Telegram — so you stop refreshing
              the page at midnight.
            </p>
          </Reveal>

          <Reveal inView={false} delay={0.18}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={() => router.push('/sign-up')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-500/90 px-7 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400"
              >
                Start free
                <ArrowRight size={16} strokeWidth={2} />
              </button>
              <Link
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                How it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
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
