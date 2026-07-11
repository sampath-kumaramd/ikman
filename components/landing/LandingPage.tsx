import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LandingNav } from './LandingNav'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { FeaturesBento } from './FeaturesBento'
import { StatsStrip } from './StatsStrip'
import { AreasMarquee } from './AreasMarquee'
import { FinalCTA } from './FinalCTA'

const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

interface LandingPageProps {
  /** next/font variable class for the display typeface */
  fontVariable: string
}

export function LandingPage({ fontVariable }: LandingPageProps) {
  return (
    // `dark` scopes the shadcn dark tokens to the landing page only —
    // the rest of the app stays on the light theme.
    <div
      className={cn(
        'dark min-h-screen overflow-x-hidden bg-[#07090f] text-foreground antialiased',
        fontVariable,
      )}
    >
      {/* film-grain overlay for atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-soft-light"
        style={{ backgroundImage: NOISE_SVG }}
      />

      <LandingNav />
      <main>
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <FeaturesBento />
        <AreasMarquee />
        <FinalCTA />
      </main>

      <footer className="relative z-10 border-t border-white/5 px-4 py-10 text-center text-xs text-zinc-600">
        <p className="text-zinc-500">
          Independent house-hunting tool · not affiliated with ikman.lk
        </p>
        <p className="mt-2">
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy
          </Link>
          <span className="mx-2 text-zinc-700">·</span>
          <Link href="/terms" className="hover:text-zinc-400">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  )
}
