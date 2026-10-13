import { rotasColecao } from '@/lib/memorial/rotas'
import { pessoaSchema } from '@/lib/schemas/memorial-pessoa'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as servico from '@/lib/services/memorial-pessoa.service'

export const runtime = 'nodejs'

const rotas = rotasColecao('/api/v1/memorial/pessoas', servico, pessoaSchema, listagemAdminSchema)

export const GET = rotas.GET
export const POST = rotas.POST
