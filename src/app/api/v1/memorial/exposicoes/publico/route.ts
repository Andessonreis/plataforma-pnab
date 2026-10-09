import { rotaPublicaPaginada } from '@/lib/memorial/rotas'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarPublicas } from '@/lib/services/memorial-exposicao.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaPaginada('/api/v1/memorial/exposicoes/publico', paginationSchema, listarPublicas)
