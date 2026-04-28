import { z } from 'zod'

export const cmsPageSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  corpo: z.string().min(1, 'Conteúdo é obrigatório'),
  publicado: z.boolean().default(false),
})

export type CmsPageInput = z.infer<typeof cmsPageSchema>
