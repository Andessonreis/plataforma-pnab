import { rotaStatus } from '@/lib/memorial/rotas'
import { mudarStatus } from '@/lib/services/memorial-exposicao.service'

export const runtime = 'nodejs'

export const POST = rotaStatus('/api/v1/memorial/exposicoes/[id]/status', mudarStatus)
