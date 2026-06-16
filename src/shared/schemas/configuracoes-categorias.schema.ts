import { z } from 'zod'

export const categoriaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
})

export const categoriaUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100).optional(),
  descricao: z.string().max(500).nullable().optional(),
  ativa: z.boolean().optional(),
})

export const categoriaReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        ordem: z.number().int().min(0),
      }),
    )
    .min(1),
})

export type CategoriaCreateInput = z.infer<typeof categoriaCreateSchema>
export type CategoriaUpdateInput = z.infer<typeof categoriaUpdateSchema>
export type CategoriaReorderInput = z.infer<typeof categoriaReorderSchema>
