import posthog from 'posthog-js'

/**
 * Client-side PostHog bootstrap (Next.js instrumentation-client).
 * Autocapture + pageviews start once NEXT_PUBLIC_POSTHOG_KEY is set.
 */
// Clerk/PostHog dashboards sometimes label this "project token"; we accept both names.
const key =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

if (typeof window !== 'undefined' && key) {
  posthog.init(key, {
    api_host: host,
    ui_host: host.includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com',
    // Prefer same-origin reverse proxy when configured (see next.config.ts)
    // Falls back to direct host above.
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })
}

export default posthog
