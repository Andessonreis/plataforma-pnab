import { rotasRegistro } from '@/lib/memorial/rotas'
import { albumSchema } from '@/lib/schemas/memorial-album'
import * as servico from '@/lib/services/memorial-album.service'

export const runtime = 'nodejs'

const rotas = rotasRegistro('/api/v1/memorial/albuns/[id]', servico, albumSchema)

export const GET = rotas.GET
export const PUT = rotas.PUT
export const DELETE = rotas.DELETE
