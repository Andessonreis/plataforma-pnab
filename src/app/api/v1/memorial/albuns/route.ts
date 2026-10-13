import { rotasColecao } from '@/lib/memorial/rotas'
import { albumSchema } from '@/lib/schemas/memorial-album'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as servico from '@/lib/services/memorial-album.service'

export const runtime = 'nodejs'

const rotas = rotasColecao('/api/v1/memorial/albuns', servico, albumSchema, listagemAdminSchema)

export const GET = rotas.GET
export const POST = rotas.POST
