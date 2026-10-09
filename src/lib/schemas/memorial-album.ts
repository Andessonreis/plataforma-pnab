import { z } from 'zod'
import { slugSchema, textoOpcional } from './memorial-comum'

export const albumSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(120),
  slug: slugSchema,
  descricao: textoOpcional(1000),
  ordem: z.number().int().min(0).max(9999).default(0),
})

export type AlbumInput = z.infer<typeof albumSchema>
