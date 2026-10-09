import { ok } from '@/lib/api/response'
import { editorial } from '@/lib/memorial/rotas'
import { chaveConfigSchema } from '@/lib/schemas/memorial-config'
import { atualizarConfiguracao } from '@/lib/services/memorial-config.service'

export const runtime = 'nodejs'

export const PUT = editorial('PUT', '/api/v1/memorial/configuracoes/[chave]', async (req, ctx, autor, params) => {
  const chave = chaveConfigSchema.parse(params.chave)
  return ok(ctx, await atualizarConfiguracao(chave, await req.json(), autor))
})
