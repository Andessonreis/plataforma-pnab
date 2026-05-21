import type { EditalStatus } from '@shared/enums/edital-status'

export type EditalResumoDTO = {
  id: string
  slug: string
  titulo: string
  ano: number
  status: EditalStatus
  resumo: string | null
  valorTotal: number | null
  categorias: string[]
  publishedAt: string | null
  createdAt: string
}

export type EditalDetalheDTO = EditalResumoDTO & {
  acoesAfirmativas: string | null
  regrasElegibilidade: string | null
  tiposProponentePermitidos: string[]
  cronograma: unknown
  camposFormulario: unknown
  etapasCustomizadas: unknown
  criteriosAvaliacao: unknown
  tiposAnexo: unknown
  notaMinima: number | null
  desempate: unknown
  formulaAvaliacao: string | null
  conteudoAcessivel: string | null
  vagasContemplados: number | null
  vagasSuplentes: number | null
  updatedAt: string
}
