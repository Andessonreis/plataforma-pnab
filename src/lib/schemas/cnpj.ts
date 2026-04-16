import { z } from 'zod'
import { isValidCnpj } from '@/lib/validators/document'

export const cnpjLookupSchema = z.object({
  cnpj: z
    .string({ required_error: 'CNPJ é obrigatório' })
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos')
    .refine(isValidCnpj, 'CNPJ inválido'),
})

export type CnpjLookupInput = z.infer<typeof cnpjLookupSchema>
