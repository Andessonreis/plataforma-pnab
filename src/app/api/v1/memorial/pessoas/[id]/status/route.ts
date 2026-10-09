import { rotaStatus } from '@/lib/memorial/rotas'
import { mudarStatus } from '@/lib/services/memorial-pessoa.service'

export const runtime = 'nodejs'

export const POST = rotaStatus('/api/v1/memorial/pessoas/[id]/status', mudarStatus)
