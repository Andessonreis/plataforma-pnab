import { rotasColecao } from '@/lib/memorial/rotas'
import { acervoItemSchema, listagemAcervoAdminSchema } from '@/lib/schemas/memorial-acervo'
import * as servico from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

const rotas = rotasColecao('/api/v1/memorial/acervo', servico, acervoItemSchema, listagemAcervoAdminSchema)

export const GET = rotas.GET
export const POST = rotas.POST
