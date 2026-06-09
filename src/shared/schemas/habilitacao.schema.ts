import { z } from 'zod'

export const habilitacaoSchema = z
  .object({
    status: z.enum(['HABILITADA', 'INABILITADA']),
    motivo: z.string().optional(),
    adminOverride: z.boolean().optional(),
    adminOverrideJustificativa: z.string().trim().min(10).optional(),
  })
  .refine((data) => !(data.status === 'INABILITADA' && (!data.motivo || !data.motivo.trim())), {
    message: 'Motivo é obrigatório para inabilitação.',
    path: ['motivo'],
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

export type HabilitacaoInput = z.infer<typeof habilitacaoSchema>
