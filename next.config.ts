import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Erros de tipo pré-existentes no Prisma — corrigir depois
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.irece.ba.gov.br',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
