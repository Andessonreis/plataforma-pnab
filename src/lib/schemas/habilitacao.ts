import { z } from 'zod'

export const habilitacaoSchema = z.object({
  status: z.enum(['HABILITADA', 'INABILITADA']),
  motivo: z.string().optional(),
  adminOverride: z.boolean().optional(),
  adminOverrideJustificativa: z.string().trim().min(10).optional(),
}).refine(
  (data) => {
    if (data.status === 'INABILITADA' && (!data.motivo || !data.motivo.trim())) {
      return false
    }
    return true
  },
  { message: 'Motivo é obrigatório para inabilitação.', path: ['motivo'] },
).refine(
  (data) => {
    if (data.adminOverride === true) {
      return Boolean(data.adminOverrideJustificativa && data.adminOverrideJustificativa.length >= 10)
    }
    return true
  },
  {
    message: 'Justificativa é obrigatória para override de admin (mínimo 10 caracteres).',
    path: ['adminOverrideJustificativa'],
  },
)

export type HabilitacaoInput = z.infer<typeof habilitacaoSchema>
