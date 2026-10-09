import { rotasRegistro } from '@/lib/memorial/rotas'
import { pessoaSchema } from '@/lib/schemas/memorial-pessoa'
import * as servico from '@/lib/services/memorial-pessoa.service'

export const runtime = 'nodejs'

const rotas = rotasRegistro('/api/v1/memorial/pessoas/[id]', servico, pessoaSchema)

export const GET = rotas.GET
export const PUT = rotas.PUT
export const DELETE = rotas.DELETE
