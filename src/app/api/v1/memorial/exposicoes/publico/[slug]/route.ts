import { rotaPublicaUnica } from '@/lib/memorial/rotas'
import { obterPublica } from '@/lib/services/memorial-exposicao.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaUnica('/api/v1/memorial/exposicoes/publico/[slug]', 'slug', obterPublica)
