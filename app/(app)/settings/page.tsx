import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SettingsForm } from '@/components/SettingsForm'
import { buttonVariants } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-400">Configure your rental search preferences</p>
        </div>
      </div>

      <SettingsForm />
    </div>
  )
}
