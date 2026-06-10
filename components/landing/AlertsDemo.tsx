'use client'

import { Send } from 'lucide-react'
import { AnimatedList } from '@/components/ui/animated-list'
import { cn } from '@/lib/utils'

interface DemoAlert {
  emoji: string
  title: string
  price: string
  meta: string
  time: string
}

const ALERTS: DemoAlert[] = [
  { emoji: '🏠', title: 'New annex in Moratuwa',          price: 'Rs. 35,000/mo', meta: '1 BR · Rawathawatta',   time: 'just now' },
  { emoji: '🏢', title: 'Apartment in Dehiwala',           price: 'Rs. 55,000/mo', meta: '2 BR · near Galle Rd',  time: '2 min ago' },
  { emoji: '🏡', title: 'House in Mount Lavinia',          price: 'Rs. 70,000/mo', meta: '2 BR · quiet lane',     time: '6 min ago' },
  { emoji: '🏠', title: 'Annex in Ratmalana',              price: 'Rs. 28,000/mo', meta: '1 BR · near station',   time: '11 min ago' },
  { emoji: '🏢', title: 'Apartment in Nugegoda',           price: 'Rs. 62,000/mo', meta: '2 BR · furnished',      time: '14 min ago' },
  { emoji: '🏠', title: 'Boarding room in Piliyandala',    price: 'Rs. 18,000/mo', meta: '1 BR · for students',   time: '20 min ago' },
]

function AlertCard({ alert }: { alert: DemoAlert }) {
  return (
    <figure
      className={cn(
        'glass-subtle relative mx-auto w-full max-w-sm cursor-default overflow-hidden rounded-2xl p-4',
        'transition-all duration-200 ease-in-out hover:bg-white/[0.08]',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-lg">
          {alert.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{alert.title}</span>
            <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
              NEW
            </span>
          </div>
          <p className="truncate text-xs text-zinc-400">
            <span className="font-medium text-sky-300">{alert.price}</span> · {alert.meta}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-zinc-500">{alert.time}</span>
      </div>
    </figure>
  )
}

/** A fake live feed of Telegram alerts — what the product feels like. */
export function AlertsDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* colour behind the pane — what the backdrop blur frosts into glass */}
      <div
        aria-hidden
        className="absolute -left-10 -top-12 size-52 rounded-full bg-sky-500/25 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-14 -right-8 size-56 rounded-full bg-indigo-500/20 blur-2xl"
      />

      <div className="glass relative overflow-hidden rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
          {/* macOS traffic lights */}
          <div className="mr-1 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-sky-500/20">
            <Send size={14} className="text-sky-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Rental Tracker Bot</p>
            <p className="text-[11px] text-emerald-400">● sending alerts</p>
          </div>
        </div>

        <div className="flex max-h-[340px] flex-col gap-3 overflow-hidden">
          <AnimatedList delay={1600}>
            {ALERTS.map((a) => (
              <AlertCard key={a.title} alert={a} />
            ))}
          </AnimatedList>
        </div>

        {/* bottom fade — translucent so the pane keeps reading as glass */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#07090f]/85 via-[#07090f]/40 to-transparent"
        />
      </div>
    </div>
  )
}
