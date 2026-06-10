'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, MailCheck,
} from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

const MODES: { value: Mode; label: string }[] = [
  { value: 'signin', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
]

/** Map raw Supabase auth errors to something a human wants to read. */
function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Wrong email or password. Double-check and try again.'
  }
  if (/user already registered/i.test(message)) {
    return 'An account with this email already exists — try signing in instead.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Your email isn’t confirmed yet. Check your inbox for the confirmation link.'
  }
  if (/at least 6 characters/i.test(message)) {
    return 'Password needs to be at least 6 characters.'
  }
  return message
}

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const supabase = getBrowserSupabase()

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        if (data.session) {
          // Email confirmation disabled on the project — signed in straight away
          router.push('/dashboard')
          router.refresh()
        } else {
          setConfirmSent(true)
        }
      }
    } catch (err) {
      setError(friendlyError((err as Error).message))
    } finally {
      setBusy(false)
    }
  }

  if (confirmSent) {
    return (
      <div className="glass relative overflow-hidden rounded-3xl p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_45%)]"
        />
        <div className="relative space-y-4">
          <span className="glass-subtle mx-auto flex size-14 items-center justify-center rounded-2xl text-emerald-400">
            <MailCheck size={26} />
          </span>
          <h2 className="font-display text-xl font-bold text-white">Check your email</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            We sent a confirmation link to{' '}
            <b className="text-zinc-200">{email}</b>. Open it to activate your
            account, then come back and sign in.
          </p>
          <button
            type="button"
            onClick={() => { setConfirmSent(false); switchMode('signin') }}
            className="text-sm font-medium text-sky-300 transition-colors hover:text-sky-200"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      {/* specular sheen across the glass */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),transparent_45%)]"
      />

      <div className="relative">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === 'signin'
            ? 'Your alerts are waiting for you.'
            : 'Two minutes from now, you’re tracking.'}
        </p>

        {/* segmented mode switch with sliding glass thumb */}
        <div className="glass-subtle mt-6 grid grid-cols-2 rounded-full p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => switchMode(m.value)}
              className={cn(
                'relative rounded-full py-2 text-sm font-medium transition-colors',
                mode === m.value ? 'text-white' : 'text-zinc-400 hover:text-zinc-200',
              )}
            >
              {mode === m.value && (
                <motion.span
                  layoutId="auth-mode-thumb"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 rounded-full bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                />
              )}
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 border-t-white/20 bg-white/[0.04] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-400/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="password">
              Password
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
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                {mode === 'signin' ? 'Sign in' : 'Create free account'}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium text-sky-300 transition-colors hover:text-sky-200"
              >
                Create a free account
              </button>
            </>
          ) : (
            <>
              Already tracking?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-medium text-sky-300 transition-colors hover:text-sky-200"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
