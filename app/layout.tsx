import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ikman Rentals – Galle Road',
  description: 'Property rental tracker for Moratuwa, Ratmalana, Mount Lavinia & Dehiwala',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <span className="font-bold text-gray-900">Rental Tracker</span>
              <span className="hidden sm:inline text-sm text-gray-400 font-normal ml-1">
                · Galle Road
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link
                href="/settings"
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Settings"
              >
                <Settings size={22} className="text-gray-600" />
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
