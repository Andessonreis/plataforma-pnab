import { NextRequest } from 'next/server'
import { adaptNextRoute } from '@server/adapters/next-route'
import { usuariosController } from '@server/modules/core/controller/usuarios.controller'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/rate-limit/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = adaptNextRoute(usuariosController.cadastrar)

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'auth/register', RATE_LIMITS['auth/register'])
  if (limited) return limited
  return handler(req)
}
