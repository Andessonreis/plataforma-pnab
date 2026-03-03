import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Suprime logs do Sentry no build
  silent: true,

  // Source maps — configurar quando tiver DSN
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
})
