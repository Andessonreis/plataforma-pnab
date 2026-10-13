import { rotaPublicaPaginada } from '@/lib/memorial/rotas'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarPublicos } from '@/lib/services/memorial-album.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaPaginada('/api/v1/memorial/albuns/publico', paginationSchema, listarPublicos)
