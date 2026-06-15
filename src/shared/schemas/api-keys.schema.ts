import { z } from 'zod'

export const createApiKeySchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
