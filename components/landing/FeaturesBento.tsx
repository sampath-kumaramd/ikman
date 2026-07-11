'use client'

import { Timer, SlidersHorizontal, Send, LayoutGrid, Eye, MapPin } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { Reveal } from './Reveal'

/** Specular streak — the diagonal light reflection you see on real glass. */
function GlassSheen({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  )
}

const FEATURES = [
  {
    Icon: Timer,
    name: 'Scraped every 15 minutes',
    description:
      'A scraper sweeps ikman.lk around the clock, so fresh listings reach you while they’re still fresh.',
    className: 'lg:col-span-2',
    background: <GlassSheen className="bg-[linear-gradient(115deg,rgba(255,255,255,0.07),transparent_38%)]" />,
  },
  {
    Icon: Send,
    name: 'Telegram alerts',
    description: 'Each match lands in your own Telegram chat with price, photos hint, location and a direct link.',
    className: 'lg:col-span-1',
    background: <GlassSheen className="bg-[linear-gradient(160deg,rgba(255,255,255,0.06),transparent_45%)]" />,
  },
  {
    Icon: SlidersHorizontal,
    name: 'Your own criteria',
    description: 'Areas, property type, budget, bedrooms — every account gets its own saved search.',
    className: 'lg:col-span-1',
    background: <GlassSheen className="bg-[linear-gradient(125deg,rgba(255,255,255,0.06),transparent_42%)]" />,
  },
  {
    Icon: LayoutGrid,
    name: 'Personal dashboard',
    description: 'Browse, filter and sort everything that matched you — only your listings, nobody else’s.',
    className: 'lg:col-span-1',
    background: <GlassSheen className="bg-[linear-gradient(105deg,rgba(255,255,255,0.05),transparent_50%)]" />,
  },
  {
    Icon: Eye,
    name: 'NEW / viewed tracking',
    description: 'Listings you haven’t seen yet are flagged NEW, so you always know what’s worth a look.',
    className: 'lg:col-span-1',
    background: <GlassSheen className="bg-[linear-gradient(140deg,rgba(255,255,255,0.06),transparent_40%)]" />,
  },
  {
    Icon: MapPin,
    name: 'All your areas at once',
    description: 'Moratuwa to Nugegoda — track as many areas as you like with one account, one feed.',
    className: 'lg:col-span-2',
    background: <GlassSheen className="bg-[linear-gradient(110deg,rgba(255,255,255,0.07),transparent_35%)]" />,
  },
]

export function FeaturesBento() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Built to win the <span className="text-sky-400">first-call race</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          Good places go in hours. Everything here exists to get you there first.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <BentoGrid className="mt-14 auto-rows-[15rem] lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <BentoCard key={feature.name} {...feature} href="/sign-up" cta="Get started" />
          ))}
        </BentoGrid>
      </Reveal>
    </section>
  )
}
