import type { TomCarimbo } from '@/components/ui/carimbo'

export interface RelatorioItem {
  titulo: string
  url: string
}

export interface ProjetoRegistrado {
  id: string
  nome: string
  proponente: string
  numeroInscricao: string
  categoria: string | null
  valor: string
  contrapartida: string | null
  situacao: { label: string; tom: TomCarimbo }
  /** Fotos enviadas na execução do projeto. Vazio na maioria dos registros. */
  imagens: string[]
  /** Documentos de prestação de contas anexados pela Secretaria, quando houver. */
  relatorios: RelatorioItem[]
}

export interface GrupoEdital {
  slug: string
  titulo: string
  ano: number
  projetos: ProjetoRegistrado[]
  /** Soma do valor aprovado dos projetos deste edital, já sob os filtros ativos. */
  subtotal: string
}

export interface Prestacao {
  grupos: GrupoEdital[]
  anos: number[]
  totalProjetos: number
  valorTotal: string
  concluidos: number
  emExecucao: number
  paginaAtual: number
  totalPaginas: number
}

export interface FiltrosPrestacao {
  ano?: number
  situacao?: string
  q?: string
  pagina?: number
}

export const SITUACOES: Record<string, { label: string; tom: TomCarimbo }> = {
  EM_EXECUCAO: { label: 'Em execução', tom: 'curso' },
  CONCLUIDO: { label: 'Concluído', tom: 'safra' },
  PRESTACAO_CONTAS: { label: 'Prestação de contas', tom: 'prestacao' },
  CANCELADO: { label: 'Cancelado', tom: 'arquivo' },
}

/**
 * Situações abertas como filtro público. Cancelado fica de fora: mostrar o
 * carimbo num projeto já publicado é transparência, transformar isso numa
 * categoria de busca é decisão de produto que a Secretaria ainda não bateu.
 */
export const SITUACOES_FILTRAVEIS = Object.entries(SITUACOES)
  .filter(([chave]) => chave !== 'CANCELADO')
  .map(([chave, valor]) => ({ chave, ...valor }))
