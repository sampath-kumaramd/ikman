import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { buttonVariants } from '@/components/ui/button'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ikman Rentals – Galle Road',
  description: 'Property rental tracker for Moratuwa, Ratmalana, Mount Lavinia & Dehiwala',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-muted/30 min-h-screen`}>
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl">🏠</span>
              <span className="font-bold text-foreground">Rental Tracker</span>
              <span className="hidden sm:inline text-sm text-muted-foreground font-normal">
                · Galle Road
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link
                href="/settings"
                aria-label="Settings"
                className={buttonVariants({ variant: 'ghost', size: 'icon' })}
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
