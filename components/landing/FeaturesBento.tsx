'use client'

import { Timer, Send, SlidersHorizontal, LayoutGrid, Eye, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from './Reveal'

const FEATURES: {
  icon: LucideIcon
  title: string
  body: string
}[] = [
  {
    icon: Timer,
    title: 'Every 10 minutes',
    body: 'We check ikman.lk every 10 minutes so new ads surface while they are still open.',
  },
  {
    icon: Send,
    title: 'Telegram first',
    body: 'Matches go to your chat with price, area and a direct link — no app dig-through.',
  },
  {
    icon: MapPin,
    title: 'Island-wide coverage',
    body: 'All ikman locations, filterable by district. Track multiple towns in one account.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Your criteria',
    body: 'Areas, rent ceiling, bedrooms and property type are saved per user — not shared.',
  },
  {
    icon: LayoutGrid,
    title: 'Private dashboard',
    body: 'Filter and sort only listings that match you. Mark items viewed as you go.',
  },
  {
    icon: Eye,
    title: 'New vs viewed',
    body: 'Unseen listings stay highlighted so you always know what still needs a call.',
  },
]

export function FeaturesBento() {
  return (
    <section id="features" className="relative">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              Product
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to move first
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-400">
              Good places go fast. This stack shortens the gap between “posted” and “you saw it”.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <article className="glass flex h-full flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.04] lg:min-h-[11rem]">
                <div className="glass-subtle flex size-10 items-center justify-center rounded-xl text-sky-300">
                  <f.icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
