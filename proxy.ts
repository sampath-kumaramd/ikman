import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/** Public pages + Telegram webhook (uses its own secrets). */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/api/telegram-webhook(.*)',
])

const isAuthPage = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/login(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname

  // Legacy /login → Clerk sign-in
  if (path === '/login' || path.startsWith('/login/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  const { userId } = await auth()

  // Signed-in users leave marketing / auth screens for the app
  if (userId && (path === '/' || isAuthPage(request))) {
    const dash = request.nextUrl.clone()
    dash.pathname = '/dashboard'
    dash.search = ''
    return NextResponse.redirect(dash)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk auto-proxy
    '/__clerk/:path*',
  ],
}
