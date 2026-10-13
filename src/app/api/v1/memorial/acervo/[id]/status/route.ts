import { rotaStatus } from '@/lib/memorial/rotas'
import { mudarStatus } from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

export const POST = rotaStatus('/api/v1/memorial/acervo/[id]/status', mudarStatus)
