import type { AgenteRow, CampoAgente } from '@/lib/agentes/campos'
import type { Emissao } from '@/lib/documentos/emissao'
import type { SituacaoClassificacao } from '@/lib/documentos/titulos'
import type { ItensBonusConfig } from '@/types/bonus-config'

export type { SituacaoClassificacao }

/**
 * Dados de entrada das listas e relatórios do edital.
 *
 * Ficam fora dos geradores porque as duas versões de layout desenham o mesmo
 * conteúdo, e porque a emissão precisa saber, por tipo, o que cada documento
 * recebe. `emissao` é opcional e pode vir nula: o documento sai mesmo quando o
 * registro falha, só que sem código de verificação.
 */

// ─── Relação de inscrições ───────────────────────────────────────────────────

export interface ListaInscricoesItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  categoria: string | null
  telefone: string | null
  notaFinal: number | null
  motivoInabilitacao: string | null
}

export interface ListaInscricoesData {
  edital: { titulo: string; ano: number }
  categoria?: string | null
  status: string
  statusLabel: string
  /** Título fixado por quem gerou; sem ele o título vem do status. */
  tituloDocumento?: string
  inscricoes: ListaInscricoesItem[]
  total: number
  agruparPorCategoria?: boolean
  emissao?: Emissao | null
}

// ─── Agentes culturais ───────────────────────────────────────────────────────

export interface ListaAgentesData {
  /** Título do documento; padrão cobre o caso mais comum. */
  titulo?: string
  /** Filtros aplicados, exibidos no cabeçalho pra o documento se explicar. */
  filtros: Array<{ label: string; value: string }>
  campos: CampoAgente[]
  agentes: AgenteRow[]
  emissao?: Emissao | null
}

// ─── Classificação ───────────────────────────────────────────────────────────

export interface LinhaClassificacao {
  posicao: number
  numero: string
  proponente: string
  notaBase: number
  notaBonus: number
  notaFinal: number
  cotista: boolean
  /** `NAO_SE_APLICA`: inscrição fora das categorias do edital — aparece na lista sem posição nem nota. */
  status: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA' | 'NAO_SE_APLICA'
  semAvaliacao: boolean
  /** Itens de bonificação validados pela comissão (chaves de `ItensBonusConfig`). */
  bonusItens?: string[]
}

export interface CategoriaClassificacao {
  nome: string
  vagasAmplaConcorrencia: number | null
  cotas: { label: string; vagas: number }[]
  valorPorProjeto: number | null
  linhas: LinhaClassificacao[]
}

export interface ListaClassificacaoData {
  edital: { titulo: string; ano: number }
  categorias: CategoriaClassificacao[]
  /** Prévia carimba a marca d'água; consolidada e final são peças publicáveis. */
  situacao: SituacaoClassificacao
  mostraBonus: boolean
  /** Itens de bonificação do edital; a versão 1 os abre em colunas B1, B2, B3... */
  bonus?: ItensBonusConfig | null
  geradoEm: Date
  /** Obrigatória de propósito: quem gera a classificação tem que decidir se há
   *  registro de emissão, nem que seja para passar null. */
  emissao: Emissao | null
}

// ─── Relatório final ─────────────────────────────────────────────────────────

export interface InscricaoItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  categoria: string | null
  notaFinal: number | null
}

export interface RelatorioFinalData {
  edital: { titulo: string; ano: number; slug: string; valorTotal: number | null }
  contemplados: InscricaoItem[]
  suplentes: InscricaoItem[]
  naoContemplados: InscricaoItem[]
  totalAvaliados: number
  emissao?: Emissao | null
}

// ─── Relatório de recursos ───────────────────────────────────────────────────

export interface RelatorioRecursosItem {
  posicao: number
  /** Protocolo da inscrição a que o recurso se refere. */
  numero: string
  nome: string
  cpfCnpj: string
  protocoladoEm: Date
  /** Deferido, Indeferido ou Em análise. */
  situacao: string
}

export interface RelatorioRecursosData {
  edital: { titulo: string; ano: number }
  /** Etapa do cronograma a que o prazo recursal se refere. */
  etapa: string
  /** Janela de interposição prevista no cronograma; nula se o edital não fixa. */
  prazo: { inicio: Date; fim: Date } | null
  /** Universo considerado na etapa (ex.: inscrições enviadas). */
  totalInscricoes: number
  labelTotalInscricoes: string
  recursos: RelatorioRecursosItem[]
  /** Recursos protocolados fora da janela; a conclusão do documento os cita. */
  foraDoPrazo?: number
  /** Tira a coluna "Protocolado em"; sem as datas na tabela, a conclusão não afirma que foi tudo no prazo. */
  ocultarProtocolo?: boolean
  emissao?: Emissao | null
}

// ─── Mapa tipo → dados ───────────────────────────────────────────────────────

/**
 * O que cada tipo emitível recebe. A emissão usa este mapa para casar o tipo
 * pedido com os dados certos e com o gerador de cada versão.
 */
export interface DadosPorTipo {
  LISTA_INSCRICOES: ListaInscricoesData
  LISTA_AGENTES: ListaAgentesData
  CLASSIFICACAO: ListaClassificacaoData
  RELATORIO_FINAL: RelatorioFinalData
  RELATORIO_RECURSOS: RelatorioRecursosData
}

export type TipoEmitivel = keyof DadosPorTipo
