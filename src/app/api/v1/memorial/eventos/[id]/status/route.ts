import { rotaStatus } from '@/lib/memorial/rotas'
import { mudarStatus } from '@/lib/services/memorial-evento.service'

export const runtime = 'nodejs'

export const POST = rotaStatus('/api/v1/memorial/eventos/[id]/status', mudarStatus)
