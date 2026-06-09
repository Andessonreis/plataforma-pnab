import type { InscricaoStatus } from '@shared/enums/inscricao-status'

export type AvaliadorDTO = {
  id: string
  nome: string
  email: string
}

export type AvaliacaoDTO = {
  id: string
  notas: unknown
  parecer: string | null
  notaTotal: number | null
  finalizada: boolean
  updatedAt: string
}

export type AvaliacaoDetalheDTO = {
  avaliacao: AvaliacaoDTO | null
  criterios: unknown[]
  inscricaoStatus: InscricaoStatus
}

export type AvaliacaoSalvaDTO = {
  id: string
  notaTotal: number | null
  finalizada: boolean
  updatedAt: string
}

export type AtribuicaoAvaliadoresDTO = {
  atribuidos: number
}
