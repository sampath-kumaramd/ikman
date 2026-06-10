import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { LandingPage } from '@/components/landing/LandingPage'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'ikman Rental Tracker — Never miss a boarding place again',
  description:
    'Instant Telegram alerts for new ikman.lk rental & boarding listings matching your area, budget and property type. Scraped every 5 minutes, around the clock.',
}

export default function HomePage() {
  return <LandingPage fontVariable={bricolage.variable} />
}
