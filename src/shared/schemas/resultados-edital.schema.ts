import { z } from 'zod'

export const publicarResultadoInputSchema = z.object({
  fase: z.enum(['RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
})

export type PublicarResultadoInput = z.infer<typeof publicarResultadoInputSchema>

export const reordenarResultadosInputSchema = z.object({
  orderedIds: z.array(z.string()).min(1, 'Informe ao menos um ID'),
})

export type ReordenarResultadosInput = z.infer<typeof reordenarResultadosInputSchema>

export const VALID_INSCRICAO_STATUS_FILTERS = [
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
] as const

export const listaInscricoesQuerySchema = z.object({
  status: z.enum(VALID_INSCRICAO_STATUS_FILTERS),
})

export type ListaInscricoesQuery = z.infer<typeof listaInscricoesQuerySchema>
