'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

export function LandingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Rental Tracker
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-sky-400"
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
