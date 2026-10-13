import { rotasColecao } from '@/lib/memorial/rotas'
import { exposicaoSchema } from '@/lib/schemas/memorial-exposicao'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as servico from '@/lib/services/memorial-exposicao.service'

export const runtime = 'nodejs'

const rotas = rotasColecao('/api/v1/memorial/exposicoes', servico, exposicaoSchema, listagemAdminSchema)

export const GET = rotas.GET
export const POST = rotas.POST
