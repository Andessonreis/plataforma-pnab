import { rotaPublicaPaginada } from '@/lib/memorial/rotas'
import { paginationSchema } from '@/lib/schemas/pagination'
import { linhaDoTempo } from '@/lib/services/memorial-evento.service'

export const runtime = 'nodejs'

/** Linha do tempo: eventos publicados em ordem de ano. */
export const GET = rotaPublicaPaginada('/api/v1/memorial/eventos/publico', paginationSchema, linhaDoTempo)
