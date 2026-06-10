'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Radar } from 'lucide-react'
import { Particles } from '@/components/ui/particles'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Reveal } from './Reveal'
import { AlertsDemo } from './AlertsDemo'

export function Hero() {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden">
      {/* atmosphere: particles + radial glow + grid */}
      <Particles
        className="absolute inset-0"
        quantity={90}
        ease={70}
        size={0.5}
        color="#7dd3fc"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,130,246,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_75%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <Reveal inView={false}>
            <span className="glass-subtle inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-sky-300">
              <Radar size={13} className="animate-pulse" />
              Scanning ikman.lk every 5 minutes
            </span>
          </Reveal>

          <Reveal inView={false} delay={0.1}>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Never miss a{' '}
              <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                boarding place
              </span>{' '}
              again.
            </h1>
          </Reveal>

          <Reveal inView={false} delay={0.2}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
              Tell us your areas, budget and property type — we watch ikman.lk
              around the clock and ping your Telegram the moment a matching
              rental is posted. Before everyone else calls.
            </p>
          </Reveal>

          <Reveal inView={false} delay={0.3}>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <ShimmerButton
                onClick={() => router.push('/login')}
                background="rgba(2,16,36,1)"
                shimmerColor="#7dd3fc"
                className="px-8 py-3.5 text-sm font-semibold shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)]"
              >
                Start tracking free
                <ArrowRight size={15} className="ml-2" />
              </ShimmerButton>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                How it works ↓
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Right: live alert feed mock */}
        <Reveal inView={false} delay={0.45}>
          <AlertsDemo />
        </Reveal>
      </div>
    </section>
  )
}
