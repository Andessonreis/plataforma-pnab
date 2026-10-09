import { rotaPublicaPaginada } from '@/lib/memorial/rotas'
import { listagemAcervoPublicoSchema } from '@/lib/schemas/memorial-acervo'
import { listarPublicos } from '@/lib/services/memorial-acervo.service'

export const runtime = 'nodejs'

export const GET = rotaPublicaPaginada('/api/v1/memorial/acervo/publico', listagemAcervoPublicoSchema, listarPublicos)
