import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'
import type { Metadata } from 'next'
import { Geist, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

const title = 'Rental Tracker'
const description =
  'Instant Telegram alerts for new ikman.lk rental & boarding listings matching your area, budget and property type.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${title} — Never miss a boarding place`,
    template: `%s`,
  },
  description,
  applicationName: title,
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    siteName: title,
    title: `${title} — Never miss a boarding place`,
    description,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} — Never miss a boarding place`,
    description,
    images: ['/og.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} ${bricolage.variable} min-h-screen bg-[#07090f] antialiased`}>
        <ClerkProvider
          appearance={{ theme: shadcn }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
