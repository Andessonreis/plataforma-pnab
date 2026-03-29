import { z } from 'zod'

export const recursoSchema = z.object({
  texto: z.string().min(10, 'O texto do recurso deve ter no mínimo 10 caracteres'),
  urlAnexos: z.array(z.string()).default([]),
})

export type RecursoInput = z.infer<typeof recursoSchema>

export const recursoDecisaoSchema = z.object({
  decisao: z.enum(['DEFERIDO', 'INDEFERIDO']),
  justificativa: z.string().min(5, 'Justificativa é obrigatória'),
})

export type RecursoDecisaoInput = z.infer<typeof recursoDecisaoSchema>
