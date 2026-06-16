import { z } from 'zod'

export const tipoAnexoCreateSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  obrigatorio: z.boolean().default(false),
  tag: z.string().min(1, 'Tag é obrigatória'),
})

export const tipoAnexoUpdateSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  obrigatorio: z.boolean().default(false),
  tag: z.string().min(1, 'Tag é obrigatória'),
})

export type TipoAnexoCreateInput = z.infer<typeof tipoAnexoCreateSchema>
export type TipoAnexoUpdateInput = z.infer<typeof tipoAnexoUpdateSchema>
