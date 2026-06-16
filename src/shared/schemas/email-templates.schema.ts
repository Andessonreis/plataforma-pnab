import { z } from 'zod'

export const emailTemplateUpsertSchema = z.object({
  subject: z.string().min(1, 'Assunto não pode ser vazio').max(255),
  body: z.string().min(1, 'Corpo não pode ser vazio').max(50_000),
  enabled: z.boolean(),
})

export const emailTemplatePreviewSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(50_000).optional(),
})

export const emailTemplateTestSendSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(50_000).optional(),
})

export type EmailTemplateUpsertInput = z.infer<typeof emailTemplateUpsertSchema>
export type EmailTemplatePreviewInput = z.infer<typeof emailTemplatePreviewSchema>
export type EmailTemplateTestSendInput = z.infer<typeof emailTemplateTestSendSchema>
