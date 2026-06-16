import { NextRequest } from 'next/server'
import { adaptNextRoute } from '@server/adapters/next-route'
import { ticketsController } from '@server/modules/atendimento/controller/tickets.controller'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = adaptNextRoute(ticketsController.contato)

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'contato', RATE_LIMITS['contato'])
  if (limited) return limited
  return handler(req)
}
