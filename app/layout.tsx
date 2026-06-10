import type { Metadata } from 'next'
import { Geist, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'ikman Rental Tracker',
  description: 'Track ikman.lk boarding & rental listings with Telegram alerts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The whole app runs on the dark glass theme; `dark` lives on <html> so
    // portalled UI (selects, popovers) picks up the dark tokens too.
    <html lang="en" className="dark">
      <body className={`${geist.className} ${bricolage.variable} min-h-screen bg-[#07090f] antialiased`}>
        {children}
      </body>
    </html>
  )
}
