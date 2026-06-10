'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  /** false = animate immediately on mount (hero load stagger); true = on scroll into view */
  inView?: boolean
}

/** Shared fade-up reveal used across the landing page. */
export function Reveal({ children, className, delay = 0, inView = true }: RevealProps) {
  const visible = { opacity: 1, y: 0 }
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 24 }}
      {...(inView
        ? { whileInView: visible, viewport: { once: true, margin: '-80px' } }
        : { animate: visible })}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}
