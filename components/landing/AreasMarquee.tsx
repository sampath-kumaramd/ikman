'use client'

import { Marquee } from '@/components/ui/marquee'
import { POPULAR_AREAS, AVAILABLE_AREAS } from '@/lib/areas'
import { Reveal } from './Reveal'

const extras = AVAILABLE_AREAS.filter((a) => !(POPULAR_AREAS as readonly string[]).includes(a))
const ROW_ONE = [...POPULAR_AREAS.slice(0, 10), ...extras.slice(0, 14)]
const ROW_TWO = [...extras.slice(14, 40)]

function AreaPill({ name }: { name: string }) {
  return (
    <span className="mx-1.5 inline-flex items-center rounded-full border border-white/[0.07] bg-transparent px-3.5 py-1.5 text-sm text-zinc-400">
      {name}
    </span>
  )
}

export function AreasMarquee() {
  return (
    <section id="coverage" className="border-b border-white/[0.06] py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400/90">
              Coverage
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Every area on ikman.lk
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Districts and towns from the official ikman location list — search or filter
              when you set up your account.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div className="relative mt-12 overflow-hidden">
          <Marquee pauseOnHover className="[--duration:48s]">
            {ROW_ONE.map((a) => (
              <AreaPill key={a} name={a} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="mt-2 [--duration:56s]">
            {ROW_TWO.map((a) => (
              <AreaPill key={`b-${a}`} name={a} />
            ))}
          </Marquee>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#06080d] to-transparent sm:w-28"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#06080d] to-transparent sm:w-28"
          />
        </div>
      </Reveal>
    </section>
  )
}
