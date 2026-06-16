import { z } from 'zod'

export const submeterRecursoSchema = z.object({
  fase: z.enum(['HABILITACAO', 'RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
  texto: z.string().min(20).max(5000),
  urlAnexos: z.array(z.string().url()).max(5).default([]),
})

export type SubmeterRecursoInput = z.infer<typeof submeterRecursoSchema>

export const decidirRecursoSchema = z.object({
  decisao: z.enum(['DEFERIDO', 'INDEFERIDO']),
  justificativa: z.string().min(5, 'Justificativa é obrigatória'),
})

export type DecidirRecursoInput = z.infer<typeof decidirRecursoSchema>

export const responderRecursoSchema = z.object({
  decisao: z.enum(['DEFERIDO', 'INDEFERIDO']),
  justificativa: z.string().min(10, 'Justificativa deve ter no mínimo 10 caracteres'),
})

export type ResponderRecursoInput = z.infer<typeof responderRecursoSchema>

export const listarRecursosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  fase: z.string().optional(),
  pendente: z.string().optional(),
})

export type ListarRecursosQueryInput = z.infer<typeof listarRecursosQuerySchema>
