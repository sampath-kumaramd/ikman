'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Reveal } from './Reveal'

export function FinalCTA() {
  const router = useRouter()

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">
        <Reveal>
          <div className="relative">
            {/* colour behind the pane, frosted by the glass blur */}
            <div
              aria-hidden
              className="absolute left-1/2 top-0 h-48 w-[34rem] max-w-full -translate-x-1/2 -translate-y-10 rounded-full bg-sky-500/25 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute bottom-0 right-10 size-44 translate-y-8 rounded-full bg-indigo-500/20 blur-2xl"
            />

            <div className="glass relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_45%)]"
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Your next place is one alert away.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-zinc-400">
                  Set it up once. We&apos;ll do the refreshing, the filtering and the
                  waking-up-at-7am part.
                </p>
                <div className="mt-9 flex justify-center">
                  <ShimmerButton
                    onClick={() => router.push('/login')}
                    background="rgba(2,16,36,1)"
                    shimmerColor="#7dd3fc"
                    className="px-8 py-3.5 text-sm font-semibold shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)]"
                  >
                    Start tracking free
                    <ArrowRight size={15} className="ml-2" />
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <span>🏠</span>
            <span className="font-display font-semibold text-zinc-300">Rental Tracker</span>
          </span>
          <span>Built for house-hunters in Sri Lanka 🇱🇰</span>
          <span>© {new Date().getFullYear()} Rental Tracker</span>
        </div>
      </footer>
    </>
  )
}
