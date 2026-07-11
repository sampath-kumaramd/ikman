import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import { NotificationBell } from '@/components/NotificationBell'
import { UserMenu } from '@/components/UserMenu'
import { getAuthUser } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase'
import { getUserSettings } from '@/lib/db'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')

  // First sign-in (or unfinished setup): force the onboarding wizard
  const settings = await getUserSettings(getAdminClient(), user.id)
  if (!settings?.onboarding_completed) redirect('/onboarding')

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ambient scene light + grid behind the glass panels */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,130,246,0.14),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_75%)]"
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="text-xl">🏠</span>
            <span className="font-display font-bold tracking-tight text-white">Rental Tracker</span>
          </Link>

          <div className="flex items-center gap-1">
            <FeedbackDialog />
            <NotificationBell />
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Settings size={20} />
            </Link>
            <UserMenu email={user.email ?? ''} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
