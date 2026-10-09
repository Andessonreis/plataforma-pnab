import { rotasRegistro } from '@/lib/memorial/rotas'
import { eventoSchema } from '@/lib/schemas/memorial-evento'
import * as servico from '@/lib/services/memorial-evento.service'

export const runtime = 'nodejs'

const rotas = rotasRegistro('/api/v1/memorial/eventos/[id]', servico, eventoSchema)

export const GET = rotas.GET
export const PUT = rotas.PUT
export const DELETE = rotas.DELETE
