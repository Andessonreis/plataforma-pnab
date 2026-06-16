import { NextRequest } from 'next/server'
import { adaptNextRoute } from '@server/adapters/next-route'
import { newsletterController } from '@server/modules/conteudo/controller/newsletter.controller'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = adaptNextRoute(newsletterController.inscrever)

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'newsletter', RATE_LIMITS['newsletter'])
  if (limited) return limited
  return handler(req)
}
