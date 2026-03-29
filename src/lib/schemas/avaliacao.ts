import { z } from 'zod'

export const notaItemSchema = z.object({
  criterio: z.string().min(1),
  nota: z.number().min(0).max(10),
  peso: z.number().min(0).max(100),
})

export const avaliacaoBodySchema = z.object({
  notas: z.array(notaItemSchema).min(1),
  parecer: z.string().optional(),
  finalizar: z.boolean().default(false),
})

export type AvaliacaoInput = z.infer<typeof avaliacaoBodySchema>
