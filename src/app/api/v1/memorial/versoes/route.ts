import { z } from 'zod'
import { okPaginated } from '@/lib/api/response'
import { editorial, querySearch } from '@/lib/memorial/rotas'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarVersoes, metaPaginacao } from '@/lib/services/memorial-conteudo.service'

export const runtime = 'nodejs'

const filtroSchema = paginationSchema.extend({
  entidade: z.enum(['MemorialExposicao', 'MemorialAcervoItem', 'MemorialPessoa', 'MemorialEvento', 'MemorialConfig']),
  entidadeId: z.string().min(1).max(40),
})

/** Histórico de versões de um conteúdo do Memorial, da mais nova para a mais antiga. */
export const GET = editorial('GET', '/api/v1/memorial/versoes', async (req, ctx) => {
  const f = filtroSchema.parse(querySearch(req))
  const { itens, total } = await listarVersoes(f.entidade, f.entidadeId, f)
  return okPaginated(ctx, itens, metaPaginacao(f, total))
})
