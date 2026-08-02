export interface PreviewRow {
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number
  finalizadas: number
  atribuidos: number
  empatado: boolean
  // Presentes só quando o edital tem vagas configuradas por categoria —
  // já vêm da mesma alocação (ampla + cotas + remanejamento) que seria salva ao publicar.
  statusPrevia?: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA'
  posicaoCategoria?: number
}

export interface VagasConfig {
  contemplados: number | null
  suplentes: number | null
  notaMinima: number | null
}
