import { rotaPublicaUnica } from '@/lib/memorial/rotas'
import { obterPublico } from '@/lib/services/memorial-evento.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaUnica('/api/v1/memorial/eventos/publico/[slug]', 'slug', obterPublico)
