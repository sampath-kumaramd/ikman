import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy – Rental Tracker',
  description: 'How Rental Tracker collects, uses, and stores your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090f] text-zinc-300">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-sky-400 transition-colors hover:text-sky-300"
        >
          ← Back home
        </Link>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: July 2026</p>

        <div className="prose-sm mt-10 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Who we are</h2>
            <p className="text-zinc-400">
              Rental Tracker is an independent hobby / MVP product that helps users
              monitor rental listings on ikman.lk. It is not affiliated with ikman.lk.
              Contact for privacy questions: use the in-app feedback form or email the
              operator of this deployment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Account:</strong> email and
                authentication data handled by <strong className="text-zinc-300">Clerk</strong>
                (we do not store your password).
              </li>
              <li>
                <strong className="text-zinc-300">Search preferences:</strong> areas,
                property types, budget, and bedroom range you choose.
              </li>
              <li>
                <strong className="text-zinc-300">Telegram:</strong> chat ID when you
                connect the bot (so we can send alerts). We do not read your other chats.
              </li>
              <li>
                <strong className="text-zinc-300">Usage in the app:</strong> which listings
                you mark as viewed, in-app notification state, and optional feedback you
                submit.
              </li>
              <li>
                <strong className="text-zinc-300">Analytics:</strong> product usage events
                and page views via PostHog when configured (e.g. features used, pages
                visited). These help improve the product.
              </li>
              <li>
                <strong className="text-zinc-300">Listing cache:</strong> titles, prices,
                locations, photos, and contact details scraped from public ikman.lk ads,
                stored so we can match and notify users.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">How we use it</h2>
            <p className="text-zinc-400">
              Data is used to run the service: match listings to your criteria, show your
              dashboard, send optional Telegram alerts, respond to feedback (including by
              email to the operator), and understand product usage. We do not sell your
              personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Where it is stored / processors</h2>
            <p className="text-zinc-400">
              Application data is stored in Supabase (PostgreSQL). Authentication is
              provided by Clerk. The web app is hosted on Vercel. Scrapes may run on
              GitHub Actions. Emails (e.g. feedback notifications) may be sent via Resend.
              Analytics may be processed by PostHog when enabled. Listing content originates
              from public ikman.lk pages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Retention & deletion</h2>
            <p className="text-zinc-400">
              You can delete your account from Settings. That removes your Clerk user,
              settings, notification rows, viewed-state, and related personal rows we
              control. Shared listing cache is not personal to you and may remain for
              other users. Feedback you submitted may be retained for product improvement
              unless you ask us to delete it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Third parties</h2>
            <p className="text-zinc-400">
              We rely on Clerk, Supabase, Vercel, GitHub, Telegram, Resend, and analytics
              providers (e.g. PostHog). Their privacy policies apply to their services. We
              do not sell your email or Telegram chat ID.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="text-zinc-400">
              Use the in-app feedback form, or contact the operator via the email used for
              this deployment if provided publicly.
            </p>
          </section>
        </div>

        <p className="mt-12 text-center text-xs text-zinc-600">
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">
            Terms of Use
          </Link>
        </p>
      </div>
    </div>
  )
}
