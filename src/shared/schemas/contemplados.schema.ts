import { z } from 'zod'

export const importContempladosSchema = z.object({
  editalId: z.string().min(1),
  contemplados: z
    .array(
      z.object({
        inscricaoId: z.string().min(1),
        valorAprovado: z.number().min(0),
      }),
    )
    .min(1),
})

export type ImportContempladosInput = z.infer<typeof importContempladosSchema>
