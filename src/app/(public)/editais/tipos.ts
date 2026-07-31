import type { EditalStatus } from '@prisma/client'

/** Edital já formatado para exibição — sem Decimal, Date nem regra de negócio. */
export interface EditalListado {
  id: string
  slug: string
  titulo: string
  resumo: string | null
  categorias: string[]
  status: EditalStatus
  statusLabel: string
  aberto: boolean
  prazoRotulo: string | null
  prazoData: string | null
  /** `null` quando não há prazo futuro no cronograma. */
  diasRestantes: number | null
  valor: string | null
}
