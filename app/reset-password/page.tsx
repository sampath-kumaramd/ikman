'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = getBrowserSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090f]">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </div>
    )
  }

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

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center px-4 pb-16">
        <div className="glass relative w-full overflow-hidden rounded-3xl p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_45%)]"
          />

          <div className="relative">
            {done ? (
              <div className="space-y-3 text-center">
                <h1 className="font-display text-2xl font-bold text-white">Password updated</h1>
                <p className="text-sm text-zinc-400">Redirecting you to the dashboard…</p>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                  Choose a new password
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Enter a new password for your account.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                      New password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border border-white/10 border-t-white/20 bg-white/[0.04] py-2.5 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-400/20"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300" htmlFor="confirm">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full rounded-xl border border-white/10 border-t-white/20 bg-white/[0.04] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white',
                      'shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]',
                      'transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60',
                    )}
                  >
                    {busy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        Update password
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
