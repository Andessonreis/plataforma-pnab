import { z } from 'zod'
import { anoSchema, idsSchema, slugSchema, textoOpcional } from './memorial-comum'

export const eventoSchema = z.object({
  titulo: z.string().trim().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
  slug: slugSchema,
  descricao: textoOpcional(20000),
  periodo: textoOpcional(120),
  ano: anoSchema,
  fontes: textoOpcional(5000),
  itemIds: idsSchema,
  pessoaIds: idsSchema,
  exposicaoIds: idsSchema,
})

export type EventoInput = z.infer<typeof eventoSchema>
