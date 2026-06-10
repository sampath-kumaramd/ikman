'use client'

import { NumberTicker } from '@/components/ui/number-ticker'
import { Reveal } from './Reveal'

const STATS = [
  { value: 5,  suffix: ' min', label: 'between scrapes' },
  { value: 9,  suffix: '+',    label: 'areas covered' },
  { value: 60, suffix: ' sec', label: 'from match to alert', prefix: '<' },
  { value: null, display: '24/7', label: 'monitoring, no naps' },
] as const

export function StatsStrip() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08} className="text-center">
            <p className="font-display text-4xl font-bold text-white sm:text-5xl">
              {'prefix' in stat && stat.prefix && (
                <span className="text-sky-400">{stat.prefix}</span>
              )}
              {stat.value !== null ? (
                <>
                  <NumberTicker
                    value={stat.value}
                    className="text-white"
                  />
                  <span className="text-sky-400">{stat.suffix}</span>
                </>
              ) : (
                <span>
                  24<span className="text-sky-400">/7</span>
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
