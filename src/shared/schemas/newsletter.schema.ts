import { z } from 'zod'

export const newsletterInscricaoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
})

export type NewsletterInscricaoInput = z.infer<typeof newsletterInscricaoSchema>
