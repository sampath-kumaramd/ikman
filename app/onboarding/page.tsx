import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { getAuthUser } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase'
import { getUserSettings } from '@/lib/db'
import { cn } from '@/lib/utils'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata = { title: 'Set up – ikman Rental Tracker' }

export default async function OnboardingPage() {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')

  const settings = await getUserSettings(getAdminClient(), user.id)
  if (settings?.onboarding_completed) redirect('/dashboard')

  return (
    <div
      className={cn(
        'dark relative min-h-screen overflow-hidden bg-[#07090f] text-foreground antialiased',
        bricolage.variable,
      )}
    >
      {/* ambient scene light + grid, same atmosphere as login/landing */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(56,130,246,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_75%)]"
      />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Rental Tracker
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-20 pt-4 sm:px-6">
        <OnboardingWizard telegramConnected={!!settings?.telegram_chat_id} />
      </main>
    </div>
  )
}
