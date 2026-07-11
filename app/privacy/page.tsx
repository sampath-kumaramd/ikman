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
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Account:</strong> email address and
                password (handled by Supabase Auth; we never store passwords in plain text).
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
                <strong className="text-zinc-300">Usage data:</strong> which listings you
                mark as viewed, and in-app notification state.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">How we use it</h2>
            <p className="text-zinc-400">
              Data is used only to run the service: match listings to your criteria,
              show your dashboard, and send optional Telegram alerts. We do not sell
              your data or use it for advertising.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Where it is stored</h2>
            <p className="text-zinc-400">
              Application data is stored in Supabase (PostgreSQL + Auth). The web app
              may be hosted on Vercel. Scrapes run on GitHub Actions. Listing content
              (titles, prices, photos, contacts) originates from public ikman.lk pages
              and is cached so we can notify you of new matches.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Retention & deletion</h2>
            <p className="text-zinc-400">
              You can delete your account from the app (account menu or settings). That
              removes your auth user, settings, notification rows, and viewed-state.
              Shared listing cache is not personal to you and may remain for other users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Third parties</h2>
            <p className="text-zinc-400">
              We rely on Supabase, Vercel, GitHub, and Telegram to operate. Their own
              privacy policies apply to their platforms. We do not share your email or
              chat ID with other product companies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="text-zinc-400">
              For privacy questions, open an issue on the project repository or contact
              the maintainer via the channels listed there.
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
