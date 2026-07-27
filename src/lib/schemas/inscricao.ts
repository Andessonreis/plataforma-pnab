import { z } from 'zod'

export const createInscricaoSchema = z.object({
  editalId: z.string().min(1, 'editalId é obrigatório'),
  categoria: z.string().optional(),
  cotasOptIn: z.array(z.string()).default([]),
})

export type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>

export const updateInscricaoSchema = z.object({
  campos: z.record(z.unknown()).optional(),
  categoria: z.string().optional(),
  cotasOptIn: z.array(z.string()).optional(),
  orcamento: z.record(z.unknown()).optional(),
})

export type UpdateInscricaoInput = z.infer<typeof updateInscricaoSchema>

export const listInscricaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})
