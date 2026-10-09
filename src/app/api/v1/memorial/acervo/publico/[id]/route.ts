import { rotaPublicaUnica } from '@/lib/memorial/rotas'
import { obterPublico } from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaUnica('/api/v1/memorial/acervo/publico/[id]', 'id', obterPublico)
