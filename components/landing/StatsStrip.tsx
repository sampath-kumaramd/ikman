'use client'

import { Reveal } from './Reveal'

const STATS = [
  { value: '10 min', label: 'Check interval' },
  { value: '300+', label: 'ikman locations covered' },
  { value: 'Telegram', label: 'Alerts on every match' },
  { value: 'Free', label: 'No card required' },
] as const

export function StatsStrip() {
  return (
    <section className="relative px-4 py-6 sm:px-6" aria-label="Highlights">
      <div className="glass mx-auto max-w-6xl overflow-hidden rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-white/10">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.05}>
              <div
                className={
                  i < 2
                    ? 'border-b border-white/10 px-4 py-8 text-center sm:border-b-0 sm:px-6 sm:py-10'
                    : 'px-4 py-8 text-center sm:px-6 sm:py-10'
                }
              >
                <p className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
