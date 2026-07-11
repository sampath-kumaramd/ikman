'use client'

import { MapPin } from 'lucide-react'
import { Marquee } from '@/components/ui/marquee'
import { AVAILABLE_AREAS } from '@/lib/areas'
import { Reveal } from './Reveal'

const MID = Math.ceil(AVAILABLE_AREAS.length / 2)
const ROW_ONE = AVAILABLE_AREAS.slice(0, MID)
const ROW_TWO = AVAILABLE_AREAS.slice(MID)

function AreaPill({ name }: { name: string }) {
  return (
    <span className="mx-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
      <MapPin size={13} className="text-sky-400" />
      {name}
    </span>
  )
}

export function AreasMarquee() {
  return (
    <section className="py-20 lg:py-24">
      <Reveal className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tracking listings along <span className="text-sky-400">Galle Road</span> and beyond
        </h2>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="relative mt-10 overflow-hidden">
          <Marquee pauseOnHover className="[--duration:32s]">
            {ROW_ONE.map((a) => <AreaPill key={a} name={a} />)}
          </Marquee>
          <Marquee reverse pauseOnHover className="mt-2 [--duration:36s]">
            {ROW_TWO.map((a) => <AreaPill key={a} name={a} />)}
          </Marquee>

          {/* edge fades */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#07090f]" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#07090f]" />
        </div>
      </Reveal>
    </section>
  )
}
