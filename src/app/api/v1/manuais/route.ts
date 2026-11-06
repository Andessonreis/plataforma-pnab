import { created, okPaginated } from '@/lib/api/response'
import { querySearch } from '@/lib/memorial/rotas'
import { revalidarPaginaPublica, rotaManuais } from '@/lib/manuais/rotas'
import { listagemManuaisSchema, manualSchema } from '@/lib/schemas/manual'
import { metaPaginacao } from '@/lib/services/memorial-conteudo.service'
import * as servico from '@/lib/services/manual.service'

export const runtime = 'nodejs'

const CAMINHO = '/api/v1/manuais'

export const GET = rotaManuais('GET', CAMINHO, async (req, ctx) => {
  const f = listagemManuaisSchema.parse(querySearch(req))
  const { itens, total } = await servico.listarAdmin(f)
  return okPaginated(ctx, itens, metaPaginacao(f, total))
})

export const POST = rotaManuais('POST', CAMINHO, async (req, ctx, autor) => {
  const manual = await servico.criar(manualSchema.parse(await req.json()), autor)
  revalidarPaginaPublica()
  return created(ctx, manual)
})
