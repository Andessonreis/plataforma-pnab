import { z } from 'zod'

export const habilitacaoSchema = z.object({
  status: z.enum(['HABILITADA', 'INABILITADA']),
  motivo: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === 'INABILITADA' && (!data.motivo || !data.motivo.trim())) {
      return false
    }
    return true
  },
  { message: 'Motivo é obrigatório para inabilitação.', path: ['motivo'] },
)

export type HabilitacaoInput = z.infer<typeof habilitacaoSchema>
