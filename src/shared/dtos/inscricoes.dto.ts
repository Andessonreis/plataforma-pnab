import type { InscricaoStatus } from '@shared/enums/inscricao-status'

export type InscricaoAnexoDTO = {
  id: string
  tipo: string
  titulo: string
  url: string
  valido: boolean | null
  observacao: string | null
  createdAt: string
}

export type InscricaoDetalheDTO = {
  id: string
  numero: string
  status: InscricaoStatus
  categoria: string | null
  campos: unknown
  orcamento: unknown
  notaFinal: number | null
  posicao: number | null
  motivoInabilitacao: string | null
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  edital: {
    id: string
    titulo: string
    slug: string
    status: string
    categorias: string[]
    camposFormulario: unknown
  }
  anexos: InscricaoAnexoDTO[]
  proponente: { id: string; nome: string }
}

export type InscricaoAdminItemDTO = {
  id: string
  numero: string
  status: InscricaoStatus
  categoria: string | null
  notaFinal: number | null
  submittedAt: string | null
  createdAt: string
  editalTitulo: string
  proponenteNome: string
  proponenteCpfCnpj: string | null
  totalAvaliacoes: number
  totalRecursos: number
}

export type InscricaoProponenteItemDTO = {
  id: string
  numero: string
  status: InscricaoStatus
  categoria: string | null
  submittedAt: string | null
  createdAt: string
  editalTitulo: string
  editalSlug: string
  totalAnexos: number
}

export type InscricaoCriacaoDTO = {
  id: string
  numero: string
}

export type InscricaoEnvioDTO = {
  numero: string
  submittedAt: string | null
}
