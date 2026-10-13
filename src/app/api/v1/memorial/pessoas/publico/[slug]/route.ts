import { rotaPublicaUnica } from '@/lib/memorial/rotas'
import { obterPublica } from '@/lib/services/memorial-pessoa.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaUnica('/api/v1/memorial/pessoas/publico/[slug]', 'slug', obterPublica)
