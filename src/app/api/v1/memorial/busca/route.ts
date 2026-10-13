import { z } from 'zod'
import { ok } from '@/lib/api/response'
import { editorial, querySearch } from '@/lib/memorial/rotas'
import { buscarNoMemorial } from '@/lib/services/memorial-busca.service'

export const runtime = 'nodejs'

const buscaSchema = z.object({ q: z.string().trim().min(2, 'Digite ao menos 2 letras').max(100) })

/** Busca do painel em exposições, acervo, pessoas e eventos (até 8 de cada). */
export const GET = editorial('GET', '/api/v1/memorial/busca', async (req, ctx) => {
  const { q } = buscaSchema.parse(querySearch(req))
  return ok(ctx, await buscarNoMemorial(q))
})
