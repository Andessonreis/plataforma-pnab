import { rotasRegistro } from '@/lib/memorial/rotas'
import { exposicaoSchema } from '@/lib/schemas/memorial-exposicao'
import * as servico from '@/lib/services/memorial-exposicao.service'

export const runtime = 'nodejs'

const rotas = rotasRegistro('/api/v1/memorial/exposicoes/[id]', servico, exposicaoSchema)

export const GET = rotas.GET
export const PUT = rotas.PUT
export const DELETE = rotas.DELETE
