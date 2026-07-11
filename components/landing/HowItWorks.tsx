'use client'

import { Reveal } from './Reveal'

const STEPS = [
  {
    step: '01',
    title: 'Create an account',
    text: 'Sign up with email. Free forever — no payment details.',
  },
  {
    step: '02',
    title: 'Set your search',
    text: 'Pick areas, rent ceiling, bedrooms and property types. Connect Telegram when you want alerts.',
  },
  {
    step: '03',
    title: 'Get matches first',
    text: 'We scrape ikman on a schedule and push listings that fit your criteria to your chat and dashboard.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400/90">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From signup to alerts in minutes
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-400">
              No browser extensions. No refreshing every tab. One setup, then we watch for you.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-0 border-t border-white/[0.06] md:grid-cols-3">
          {STEPS.map((item, i) => (
            <Reveal key={item.step} delay={i * 0.08}>
              <li
                className={
                  i < STEPS.length - 1
                    ? 'border-b border-white/[0.06] py-8 md:border-b-0 md:border-r md:pr-8 md:pt-10 md:pb-2'
                    : 'py-8 md:pt-10 md:pb-2 md:pl-8'
                }
              >
                <span className="font-mono text-xs font-medium tabular-nums text-zinc-600">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
