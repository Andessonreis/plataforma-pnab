import { z } from 'zod'

export const noticiaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  corpo: z.string().min(10, 'Corpo deve ter no mínimo 10 caracteres'),
  tags: z.array(z.string()).default([]),
  imagemUrl: z.string().nullable().optional(),
  publicado: z.boolean().default(false),
  publicadoEm: z.string().nullable().optional(),
})

export type NoticiaInput = z.infer<typeof noticiaSchema>
