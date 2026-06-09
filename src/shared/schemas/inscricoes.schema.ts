import { z } from 'zod'

export const createInscricaoSchema = z.object({
  editalId: z.string().min(1, 'editalId é obrigatório'),
  categoria: z.string().optional(),
})

export type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>

export const updateInscricaoSchema = z.object({
  campos: z.record(z.string(), z.unknown()).optional(),
  categoria: z.string().optional(),
  orcamento: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateInscricaoInput = z.infer<typeof updateInscricaoSchema>

export const inscricoesAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  editalId: z.string().optional(),
  status: z.string().optional(),
})

export type InscricoesAdminQuery = z.infer<typeof inscricoesAdminQuerySchema>

export const inscricoesProponenteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export type InscricoesProponenteQuery = z.infer<typeof inscricoesProponenteQuerySchema>
