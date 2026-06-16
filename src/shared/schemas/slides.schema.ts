import { z } from 'zod'

export const slideSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  ordem: z.coerce.number().int().default(0),
  ativo: z.boolean().default(true),
  inicioEm: z.string().nullable().optional(),
  fimEm: z.string().nullable().optional(),
})

export type SlideInput = z.infer<typeof slideSchema>
