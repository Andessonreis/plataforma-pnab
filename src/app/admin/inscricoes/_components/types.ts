import type { InscricaoStatus } from '@prisma/client'

export interface InscricaoListItem {
  id: string
  numero: string
  categoria: string | null
  status: InscricaoStatus
  submittedAt: Date | null
  edital: { titulo: string; slug: string }
  proponente: { nome: string; cpfCnpj: string | null; email: string }
  avaliacoes?: { finalizada: boolean; notaTotal: unknown }[]
  _count?: { avaliacoes: number }
}
