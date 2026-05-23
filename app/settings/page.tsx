import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SettingsForm } from '@/components/SettingsForm'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure your rental search preferences</p>
        </div>
      </div>

      <SettingsForm />
    </div>
  )
}
