export type RecursoDTO = {
  id: string
  fase: string
  texto: string
  urlAnexos: string[]
  decisao: string | null
  justificativa: string | null
  decididoPor: string | null
  createdAt: string
  decidedAt: string | null
}

export type ConsolidacaoEstado = 'PENDENTE' | 'DIVERGENTE' | 'CONSOLIDADO'

export type RespostaRecursoResultDTO = {
  estado: ConsolidacaoEstado
}
