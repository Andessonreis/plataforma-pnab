import { z } from 'zod'

export const cmsPageSchema = z.object({
  titulo: z.string().min(3, 'Titulo deve ter no minimo 3 caracteres'),
  corpo: z.string().min(1, 'Conteudo e obrigatorio'),
  publicado: z.boolean().default(false),
})

export type CmsPageInput = z.infer<typeof cmsPageSchema>
