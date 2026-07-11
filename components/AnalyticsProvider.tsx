'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { identifyUser, resetAnalytics } from '@/lib/analytics'

/**
 * Links Clerk users to PostHog identities.
 * PostHog itself is initialized in instrumentation-client.ts.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress ?? null,
      })
    } else {
      resetAnalytics()
    }
  }, [isLoaded, isSignedIn, user])

  return <>{children}</>
}
