export interface CriterioConfig {
  criterio: string
  peso: number
  descricao?: string
  notaMax: number
  bloco?: string
  modo?: 'slider' | 'discreto'
  naoAtende?: number
  parcial?: number
  plenamente?: number
}

export interface NotaItem {
  criterio: string
  nota: number
  peso: number
}

export interface AvaliacaoData {
  id: string
  notas: NotaItem[]
  parecer: string | null
  notaTotal: string | number | null
  finalizada: boolean
  updatedAt: string
}
