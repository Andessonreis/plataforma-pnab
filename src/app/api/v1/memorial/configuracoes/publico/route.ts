import { ok } from '@/lib/api/response'
import { CACHE_PUBLICO, manipulador } from '@/lib/memorial/rotas'
import { lerConfiguracoesPublicas } from '@/lib/services/memorial-config.service'

export const runtime = 'nodejs'

export const GET = manipulador('GET', '/api/v1/memorial/configuracoes/publico', async (_req, ctx) =>
  ok(ctx, await lerConfiguracoesPublicas(), CACHE_PUBLICO),
)
