import { z } from 'zod'

export const notaItemSchema = z.object({
  criterio: z.string().min(1),
  nota: z.number().min(0).max(10),
  peso: z.number().min(0).max(100),
})

export const avaliacaoBodySchema = z
  .object({
    notas: z.array(notaItemSchema).min(1),
    parecer: z.string().optional(),
    finalizar: z.boolean().default(false),
    adminOverride: z.boolean().optional(),
    adminOverrideJustificativa: z.string().trim().min(10).optional(),
  })
  .refine(
    (data) =>
      data.adminOverride !== true ||
      Boolean(data.adminOverrideJustificativa && data.adminOverrideJustificativa.length >= 10),
    {
      message: 'Justificativa é obrigatória para override de admin (mínimo 10 caracteres).',
      path: ['adminOverrideJustificativa'],
    },
  )

export type AvaliacaoInput = z.infer<typeof avaliacaoBodySchema>

export const atribuirAvaliadoresSchema = z
  .object({
    avaliadorIds: z.array(z.string().min(1)).min(1, 'Informe ao menos um avaliador'),
    adminOverride: z.boolean().optional(),
    adminOverrideJustificativa: z.string().trim().min(10).optional(),
  })
  .refine(
    (data) =>
      data.adminOverride !== true ||
      Boolean(data.adminOverrideJustificativa && data.adminOverrideJustificativa.length >= 10),
    {
      message: 'Justificativa é obrigatória para override (mínimo 10 caracteres).',
      path: ['adminOverrideJustificativa'],
    },
  )

export type AtribuirAvaliadoresInput = z.infer<typeof atribuirAvaliadoresSchema>
