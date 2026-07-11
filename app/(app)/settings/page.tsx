import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SettingsForm } from '@/components/SettingsForm'
import { buttonVariants } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Search criteria, Telegram alerts, and account
            </p>
          </div>
        </div>
      </div>

      <SettingsForm />
    </div>
  )
}
