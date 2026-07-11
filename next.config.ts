import type { NextConfig } from 'next'

/**
 * Optional reverse proxy for PostHog (reduces ad-blocker drops).
 * Client still uses NEXT_PUBLIC_POSTHOG_HOST; set it to `/ingest` in prod
 * after this proxy is live, or keep the full https://us.i.posthog.com host.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Required for PostHog trailing slash API routes
  skipTrailingSlashRedirect: true,
}

export default nextConfig
