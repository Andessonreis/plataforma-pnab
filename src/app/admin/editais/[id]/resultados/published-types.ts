import type { InscricaoStatus } from '@prisma/client'

/** Linha normalizada da tabela oficial pós-publicação — Decimal do Prisma já convertido para number. */
export interface PublishedRow {
  inscricaoId: string
  posicaoExibida: number
  proponenteNome: string
  numero: string
  categoria: string | null
  totalAvaliacoes: number
  notaFinal: number | null
  isEmpatada: boolean
  status: InscricaoStatus
}
