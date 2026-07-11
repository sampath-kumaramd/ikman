'use client'

import posthog from 'posthog-js'

/** Typed product events for PostHog. No-ops when PostHog is not configured. */
export type AnalyticsEvent =
  | 'onboarding_criteria_saved'
  | 'onboarding_completed'
  | 'settings_saved'
  | 'telegram_connect_started'
  | 'telegram_connected'
  | 'telegram_unlinked'
  | 'telegram_test_sent'
  | 'scrape_triggered'
  | 'listing_opened'
  | 'account_deleted'
  | 'feedback_submitted'

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === 'undefined') return
  if (!posthogEnabled()) return
  try {
    posthog.capture(event, properties)
  } catch {
    // never break UX for analytics
  }
}

function posthogEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  )
}

export function identifyUser(userId: string, traits?: { email?: string | null }): void {
  if (typeof window === 'undefined') return
  if (!posthogEnabled()) return
  try {
    posthog.identify(userId, {
      email: traits?.email ?? undefined,
    })
  } catch {
    // ignore
  }
}

export function resetAnalytics(): void {
  if (typeof window === 'undefined') return
  if (!posthogEnabled()) return
  try {
    posthog.reset()
  } catch {
    // ignore
  }
}
