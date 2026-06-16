import { z } from 'zod'

const criterioSchema = z.object({
  criterio: z.string().min(1),
  peso: z.number().min(0),
  descricao: z.string().optional(),
  notaMax: z.number().min(0),
  bloco: z.string().optional(),
  modo: z.enum(['slider', 'discreto']).optional(),
  naoAtende: z.number().min(0).optional(),
  parcial: z.number().min(0).optional(),
  plenamente: z.number().min(0).optional(),
})

export const templateAvaliacaoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  descricao: z.string().max(1000).optional(),
  criterios: z.array(criterioSchema).min(1, 'Pelo menos um critério é obrigatório'),
  formula: z.string().max(200).optional(),
})

export const templateAvaliacaoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200).optional(),
  descricao: z.string().max(1000).nullable().optional(),
  criterios: z.array(criterioSchema).min(1).optional(),
  formula: z.string().max(200).nullable().optional(),
  ativo: z.boolean().optional(),
})

export type TemplateAvaliacaoCreateInput = z.infer<typeof templateAvaliacaoCreateSchema>
export type TemplateAvaliacaoUpdateInput = z.infer<typeof templateAvaliacaoUpdateSchema>
