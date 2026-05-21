import { z } from 'zod'

export const loginInputSchema = z.object({
  cpfCnpj: z.string().min(11, 'CPF/CNPJ obrigatório').max(18),
  password: z.string().min(1, 'Senha obrigatória'),
  deviceLabel: z.string().max(80).optional(),
})

export type LoginInput = z.infer<typeof loginInputSchema>

export const refreshInputSchema = z.object({}).optional()
