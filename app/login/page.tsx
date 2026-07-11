import type { Metadata } from 'next'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import { Radar, Send, Timer } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'
import { cn } from '@/lib/utils'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = { title: 'Sign in – ikman Rental Tracker' }

const PERKS = [
  {
    icon: Timer,
    title: 'Scraped every 5 minutes',
    text: 'ikman.lk is swept around the clock so nothing slips past you.',
  },
  {
    icon: Send,
    title: 'Telegram alerts',
    text: 'Matches land in your chat with price, location and a direct link.',
  },
  {
    icon: Radar,
    title: 'Your own criteria',
    text: 'Areas, budget, property type — saved per account, changed anytime.',
  },
]

export default function LoginPage() {
  return (
    <div
      className={cn(
        'dark relative flex min-h-screen flex-col overflow-hidden bg-[#07090f] text-foreground antialiased',
        bricolage.variable,
      )}
    >
      {/* ambient scene light + grid, same atmosphere as the landing page */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,130,246,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_75%)]"
      />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Rental Tracker
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1fr_26rem] lg:gap-16">
        {/* Left: pitch (collapses above the card on small screens) */}
        <div className="text-center lg:text-left">
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            The first call{' '}
            <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              wins the place.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-zinc-400 lg:mx-0">
            Sign in to manage your alerts — or create a free account and get
            your first matching listing within minutes.
          </p>

          <ul className="mt-8 hidden space-y-4 lg:block">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex items-start gap-3">
                <span className="glass-subtle flex size-9 shrink-0 items-center justify-center rounded-xl text-sky-300">
                  <perk.icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{perk.title}</span>
                  <span className="block text-sm text-zinc-400">{perk.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: the auth card, frosted over colour blobs */}
        <div className="relative w-full max-w-md justify-self-center lg:justify-self-end">
          <div
            aria-hidden
            className="absolute -left-12 -top-14 size-48 rounded-full bg-sky-500/25 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -right-10 size-52 rounded-full bg-indigo-500/20 blur-2xl"
          />
          <AuthForm />
        </div>
      </main>

      <footer className="relative z-10 space-y-2 pb-6 text-center text-xs text-zinc-600">
        <p>Free forever · no credit card · built for house-hunters in Sri Lanka 🇱🇰</p>
        <p className="text-zinc-700">
          Not affiliated with ikman.lk ·{' '}
          <Link href="/privacy" className="hover:text-zinc-500">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-zinc-500">Terms</Link>
        </p>
      </footer>
    </div>
  )
}
