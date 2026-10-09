import { rotasColecao } from '@/lib/memorial/rotas'
import { eventoSchema } from '@/lib/schemas/memorial-evento'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as servico from '@/lib/services/memorial-evento.service'

export const runtime = 'nodejs'

const rotas = rotasColecao('/api/v1/memorial/eventos', servico, eventoSchema, listagemAdminSchema)

export const GET = rotas.GET
export const POST = rotas.POST
