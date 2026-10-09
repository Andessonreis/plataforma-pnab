import { rotasRegistro } from '@/lib/memorial/rotas'
import { acervoItemSchema } from '@/lib/schemas/memorial-acervo'
import * as servico from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

const rotas = rotasRegistro('/api/v1/memorial/acervo/[id]', servico, acervoItemSchema)

export const GET = rotas.GET
export const PUT = rotas.PUT
export const DELETE = rotas.DELETE
