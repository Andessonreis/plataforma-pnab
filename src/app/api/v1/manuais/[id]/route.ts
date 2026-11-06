import { ok } from '@/lib/api/response'
import { revalidarPaginaPublica, rotaManuais } from '@/lib/manuais/rotas'
import { manualSchema } from '@/lib/schemas/manual'
import * as servico from '@/lib/services/manual.service'

export const runtime = 'nodejs'

const CAMINHO = '/api/v1/manuais/[id]'

export const GET = rotaManuais('GET', CAMINHO, async (_req, ctx, _autor, { id }) => ok(ctx, await servico.obter(id)))

export const PUT = rotaManuais('PUT', CAMINHO, async (req, ctx, autor, { id }) => {
  const manual = await servico.atualizar(id, manualSchema.parse(await req.json()), autor)
  revalidarPaginaPublica()
  return ok(ctx, manual)
})

export const DELETE = rotaManuais('DELETE', CAMINHO, async (_req, ctx, autor, { id }) => {
  await servico.excluir(id, autor)
  revalidarPaginaPublica()
  return ok(ctx, { id })
})
