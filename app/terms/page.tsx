import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use – Rental Tracker',
  description: 'Terms of use for the Rental Tracker service.',
}

export default function TermsPage() {
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
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: July 2026</p>

        <div className="prose-sm mt-10 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">What this service is</h2>
            <p className="text-zinc-400">
              Rental Tracker is an independent tool that monitors publicly available
              rental listings on ikman.lk and notifies you of matches based on filters
              you set. It is not affiliated with, endorsed by, or partnered with
              ikman.lk or its operators. Automated collection of listing data may conflict
              with third-party terms of service; the service is provided for personal
              house-hunting convenience and may be changed or discontinued at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Third-party content</h2>
            <p className="text-zinc-400">
              Listing titles, prices, photos, locations, and contact details belong to
              their original posters and to the source platform. We show them so you can
              act quickly; always verify details on the original ikman.lk ad before
              contacting anyone or making decisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">No guarantees</h2>
            <p className="text-zinc-400">
              The service is provided “as is.” Scraping, matching, and alerts may be
              delayed, incomplete, or interrupted if the source site changes, hosts
              block automated access, or infrastructure fails. We do not guarantee that
              you will see every listing or win any rental.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Your responsibilities</h2>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Use the service lawfully and for personal house-hunting only.</li>
              <li>Do not abuse scrape triggers or attempt to disrupt the system.</li>
              <li>
                You are solely responsible for messages you send to landlords or agents.
              </li>
              <li>Keep your account credentials secure.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Accounts</h2>
            <p className="text-zinc-400">
              We may suspend or remove accounts that abuse the service. You may delete
              your account at any time from the app.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Limitation of liability</h2>
            <p className="text-zinc-400">
              To the fullest extent permitted by law, the maintainers are not liable for
              any loss arising from use of (or inability to use) the service, including
              missed listings, incorrect data, or failed alerts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Changes</h2>
            <p className="text-zinc-400">
              These terms may be updated as the project evolves. Continued use after
              changes means you accept the updated terms.
            </p>
          </section>
        </div>

        <p className="mt-12 text-center text-xs text-zinc-600">
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
