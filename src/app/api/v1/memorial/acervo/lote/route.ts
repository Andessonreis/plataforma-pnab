import { created } from '@/lib/api/response'
import { editorial } from '@/lib/memorial/rotas'
import { acervoLoteSchema } from '@/lib/schemas/memorial-acervo'
import { criarLote } from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

/** Cria um rascunho por foto enviada no upload múltiplo. */
export const POST = editorial('POST', '/api/v1/memorial/acervo/lote', async (req, ctx, autor) =>
  created(ctx, await criarLote(acervoLoteSchema.parse(await req.json()), autor)),
)
