import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  serverExternalPackages: ['pdfkit'],
  typescript: {
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
        hostname: 'culturaeturismo.irece.ba.gov.br',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Redirects de URLs antigas para preservar bookmarks após renomes (#72)
  async redirects() {
    return [
      {
        source: '/admin/tickets',
        destination: '/admin/atendimentos',
        permanent: true,
      },
      {
        source: '/admin/tickets/:path*',
        destination: '/admin/atendimentos/:path*',
        permanent: true,
      },
    ]
  },
}

// Sentry só em produção com DSN configurado
let exportedConfig = nextConfig
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs')
  exportedConfig = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  })
}

export default exportedConfig
