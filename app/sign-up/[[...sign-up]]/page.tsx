import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = { title: 'Create account – Rental Tracker' }

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#07090f] text-foreground antialiased">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,130,246,0.16),transparent_70%)]"
      />
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Rental Tracker
          </span>
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-[#0b0f1a]/90 border border-white/10 shadow-2xl',
            },
          }}
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
        />
      </main>
      <footer className="relative z-10 space-y-2 pb-6 text-center text-xs text-zinc-600">
        <p>
          <Link href="/privacy" className="hover:text-zinc-500">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-zinc-500">Terms</Link>
        </p>
      </footer>
    </div>
  )
}
