import { z } from 'zod'

export const faqSchema = z.object({
  pergunta: z.string().min(5, 'Pergunta deve ter no minimo 5 caracteres'),
  resposta: z.string().min(5, 'Resposta deve ter no minimo 5 caracteres'),
  editalId: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
  publicado: z.boolean().default(true),
})

export type FaqInput = z.infer<typeof faqSchema>
