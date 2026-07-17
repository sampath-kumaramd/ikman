'use client'

import { AppLogo } from '@/components/AppLogo'
import { AnimatedList } from '@/components/ui/animated-list'
import { cn } from '@/lib/utils'

interface DemoAlert {
  title: string
  price: string
  meta: string
  time: string
}

const ALERTS: DemoAlert[] = [
  { title: 'Annex · Moratuwa', price: 'Rs. 35,000', meta: '1 BR · Rawathawatta', time: 'now' },
  { title: 'Apartment · Dehiwala', price: 'Rs. 55,000', meta: '2 BR · Galle Road', time: '2m' },
  { title: 'House · Mount Lavinia', price: 'Rs. 70,000', meta: '2 BR · quiet lane', time: '6m' },
  { title: 'Annex · Ratmalana', price: 'Rs. 28,000', meta: '1 BR · near station', time: '11m' },
  { title: 'Apartment · Nugegoda', price: 'Rs. 62,000', meta: '2 BR · furnished', time: '14m' },
  { title: 'Room · Piliyandala', price: 'Rs. 18,000', meta: '1 BR · students', time: '20m' },
]

function AlertCard({ alert }: { alert: DemoAlert }) {
  return (
    <figure
      className={cn(
        'glass-subtle w-full rounded-2xl px-3.5 py-3',
        'transition-colors hover:bg-white/[0.08]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{alert.title}</p>
            <span className="shrink-0 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
              New
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            <span className="font-medium text-sky-300">{alert.price}</span>
            <span className="text-zinc-600"> · </span>
            {alert.meta}
          </p>
        </div>
        <time className="shrink-0 pt-0.5 text-[11px] tabular-nums text-zinc-500">{alert.time}</time>
      </div>
    </figure>
  )
}

/** Product preview: Telegram-style alert feed on glass. */
export function AlertsDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="glass relative overflow-hidden rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-3 border-b border-white/10 pb-3">
          <AppLogo size={36} className="rounded-full ring-white/15" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Rental Tracker</p>
            <p className="text-[11px] text-zinc-400">Telegram · matches only</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400/90">
            <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
            Live
          </span>
        </div>

        <div className="relative flex max-h-[320px] flex-col gap-2.5 overflow-hidden">
          <AnimatedList delay={1800}>
            {ALERTS.map((a) => (
              <AlertCard key={a.title} alert={a} />
            ))}
          </AnimatedList>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07090f]/85 via-[#07090f]/35 to-transparent"
          />
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-500 lg:text-left">
        Example feed — we scan every 10 min for your areas and budget
      </p>
    </div>
  )
}
