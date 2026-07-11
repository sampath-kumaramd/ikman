import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LandingNav } from './LandingNav'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { FeaturesBento } from './FeaturesBento'
import { StatsStrip } from './StatsStrip'
import { AreasMarquee } from './AreasMarquee'
import { FinalCTA } from './FinalCTA'

interface LandingPageProps {
  fontVariable: string
}

export function LandingPage({ fontVariable }: LandingPageProps) {
  return (
    <div
      className={cn(
        'dark min-h-screen overflow-x-hidden bg-[#06080d] text-zinc-100 antialiased',
        fontVariable,
      )}
    >
      <LandingNav />
      <main>
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <FeaturesBento />
        <AreasMarquee />
        <FinalCTA />
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-300"
                aria-hidden
              >
                RT
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-white">
                Rental Tracker
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">
              Telegram alerts for new ikman.lk rentals. Independent tool — not
              affiliated with ikman.lk.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-6 text-sm">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Product
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#features" className="transition-colors hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/sign-up" className="transition-colors hover:text-white">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                Legal
              </p>
              <ul className="space-y-2 text-zinc-400">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-white">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:px-6">
            <span>© {new Date().getFullYear()} Rental Tracker</span>
            <span>Built for house-hunters in Sri Lanka</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
