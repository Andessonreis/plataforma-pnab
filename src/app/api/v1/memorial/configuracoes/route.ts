import { ok } from '@/lib/api/response'
import { editorial } from '@/lib/memorial/rotas'
import { lerConfiguracoes } from '@/lib/services/memorial-config.service'

export const runtime = 'nodejs'

export const GET = editorial('GET', '/api/v1/memorial/configuracoes', async (_req, ctx) =>
  ok(ctx, await lerConfiguracoes()),
)
