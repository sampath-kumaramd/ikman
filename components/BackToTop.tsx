'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Floating control — scrolls the window back to the top after the user scrolls down. */
export function BackToTop({ threshold = 320 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        'fixed bottom-5 right-4 z-40 flex size-11 items-center justify-center rounded-full',
        'border border-white/15 bg-[#0c1018]/90 text-white shadow-lg backdrop-blur-md',
        'transition-all duration-200 hover:border-sky-400/40 hover:bg-sky-500 hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50',
        'sm:bottom-8 sm:right-8',
        'pb-[env(safe-area-inset-bottom)]',
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp size={18} strokeWidth={2.5} />
    </button>
  )
}
