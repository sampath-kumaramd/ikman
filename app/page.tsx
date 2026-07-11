import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { LandingPage } from '@/components/landing/LandingPage'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'Rental Tracker — Telegram alerts for ikman.lk rentals',
  description:
    'Track ikman.lk apartments, annexes and houses by area and budget. Get Telegram alerts when new matching listings are posted.',
}

export default function HomePage() {
  return <LandingPage fontVariable={bricolage.variable} />
}
