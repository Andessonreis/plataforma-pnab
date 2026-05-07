import { z } from 'zod'

/**
 * Override de fase do edital para ADMIN.
 *
 * AVALIADOR/HABILITADOR são bloqueados fora da fase. ADMIN também é
 * bloqueado por padrão, mas pode forçar com adminOverride=true e uma
 * justificativa textual obrigatória — registrada em audit log.
 *
 * Bugs #84/#85.
 */
export const adminOverrideSchema = z.object({
  adminOverride: z.boolean().optional(),
  adminOverrideJustificativa: z.string().trim().min(10).optional(),
}).refine(
  (data) => {
    if (data.adminOverride === true) {
      return Boolean(data.adminOverrideJustificativa && data.adminOverrideJustificativa.length >= 10)
    }
    return true
  },
  {
    message: 'Justificativa é obrigatória para override (mínimo 10 caracteres).',
    path: ['adminOverrideJustificativa'],
  },
)

export type AdminOverrideInput = z.infer<typeof adminOverrideSchema>
