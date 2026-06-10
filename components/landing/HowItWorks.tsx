'use client'

import { UserPlus, SlidersHorizontal, BellRing } from 'lucide-react'
import { Reveal } from './Reveal'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your account',
    text: 'Sign up with your email in seconds — no credit card, completely free.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Set your requirements',
    text: 'Pick your areas, property types, max rent and bedrooms, then connect Telegram with one tap.',
  },
  {
    icon: BellRing,
    title: 'Get instant alerts',
    text: 'New matching listings land in your Telegram within minutes of being posted on ikman.lk.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Up and running in <span className="text-sky-400">two minutes</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          Three steps between you and never refreshing ikman.lk again.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.12}>
            <div className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-colors hover:bg-white/[0.03]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_40%)]"
              />
              <span className="absolute right-5 top-4 font-display text-5xl font-bold text-white/5 transition-colors group-hover:text-sky-400/10">
                {i + 1}
              </span>
              <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <step.icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
