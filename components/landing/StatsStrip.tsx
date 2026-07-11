'use client'

import { Reveal } from './Reveal'

const STATS = [
  { value: '15 min', label: 'Typical check interval' },
  { value: '300+', label: 'ikman locations covered' },
  { value: 'Telegram', label: 'Alerts on every match' },
  { value: 'Free', label: 'No card required' },
] as const

export function StatsStrip() {
  return (
    <section className="border-b border-white/[0.06]" aria-label="Highlights">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-y divide-white/[0.06] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <div className="px-4 py-8 text-center sm:px-6 sm:py-10">
              <p className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs text-zinc-500 sm:text-sm">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
