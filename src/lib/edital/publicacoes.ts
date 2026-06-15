import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@server/lib/db'
import { cumulativeStatuses } from '@/lib/status-maps'
import { parseBrazilDateTime } from '@shared/utils/format'
import type { AcaoPublicacao, CronogramaItem } from '@/types/cronograma'
import { isAcaoPublicacao, isAcaoResultado } from '@/types/cronograma'

// Status que cada tipo de publicação enumera.
//
// INSCRITOS: tudo que saiu de RASCUNHO (foi efetivamente submetido).
// HABILITADOS: cumulativo de HABILITADA + INABILITADA — a publicação do
// resultado da habilitação no Diário Oficial precisa listar AMBOS os lados
// pra que o inabilitado possa abrir recurso. A coluna Status na UI/CSV
// diferencia visualmente.
// POS_RECURSOS: mesma fonte; a diferença é o momento (snapshot pós-decisão
// dos recursos — quem foi inabilitado mas teve recurso provido aparece
// como HABILITADA aqui).
const PUBLICACAO_STATUS_FILTER: Record<AcaoPublicacao, InscricaoStatus[]> = {
  PUBLICACAO_INSCRITOS: [
    'ENVIADA',
    'HABILITADA',
    'INABILITADA',
    'EM_AVALIACAO',
    'RESULTADO_PRELIMINAR',
    'RECURSO_ABERTO',
    'RESULTADO_FINAL',
    'CONTEMPLADA',
    'NAO_CONTEMPLADA',
    'SUPLENTE',
  ],
  PUBLICACAO_HABILITADOS: [...cumulativeStatuses.HABILITADA, 'INABILITADA'],
  PUBLICACAO_HABILITADOS_POS_RECURSOS: [...cumulativeStatuses.HABILITADA, 'INABILITADA'],
  // Resultado preliminar: todos que entraram na classificação (preliminar em diante).
  PUBLICACAO_RESULTADO_PRELIMINAR: [
    'RESULTADO_PRELIMINAR',
    'RECURSO_ABERTO',
    'RESULTADO_FINAL',
    'CONTEMPLADA',
    'NAO_CONTEMPLADA',
    'SUPLENTE',
  ],
  // Resultado final: somente o estado final da classificação.
  PUBLICACAO_RESULTADO_FINAL: ['RESULTADO_FINAL', 'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'],
}

export const PUBLICACAO_LABELS: Record<AcaoPublicacao, string> = {
  PUBLICACAO_INSCRITOS: 'Lista de inscritos',
  PUBLICACAO_HABILITADOS: 'Resultado da habilitação',
  PUBLICACAO_HABILITADOS_POS_RECURSOS: 'Resultado da habilitação após recursos',
  PUBLICACAO_RESULTADO_PRELIMINAR: 'Resultado preliminar da avaliação',
  PUBLICACAO_RESULTADO_FINAL: 'Resultado final',
}

export interface PublicacaoItem {
  numero: string
  nome: string
  cpfCnpj: string | null
  categoria: string | null
  status: InscricaoStatus
  /** Posição na classificação — presente apenas nas publicações de resultado. */
  posicao: number | null
  /** Nota final — presente apenas nas publicações de resultado. */
  notaFinal: number | null
}

export interface PublicacaoResult {
  /** A ação solicitada existe no cronograma deste edital? */
  exists: boolean
  /** O marco já chegou (dataHora <= now)? Se false, a lista é considerada não-publicada. */
  visivel: boolean
  /** Data do marco no cronograma (ISO ou string original). */
  dataPublicacao: string | null
  /** Label humano da publicação (ex: "Lista de habilitados"). */
  label: string
  /** Items da lista — sempre vazio quando `visivel` é false. */
  items: PublicacaoItem[]
}

/**
 * Localiza o item do cronograma cujo `acao` é a publicação solicitada.
 * Se houver mais de um (ex.: admin duplicou por engano), retorna o **primeiro**.
 */
function findMarco(
  cronograma: unknown,
  acao: AcaoPublicacao,
): { dataHora: string } | null {
  const raw = (typeof cronograma === 'string'
    ? safeParseJson(cronograma)
    : cronograma) as CronogramaItem[] | null

  if (!Array.isArray(raw)) return null

  for (const item of raw) {
    if (
      item
      && typeof item === 'object'
      && 'tipo' in item
      && item.tipo === 'custom'
      && isAcaoPublicacao(item.acao)
      && item.acao === acao
      && typeof item.dataHora === 'string'
      && item.dataHora.trim() !== ''
    ) {
      return { dataHora: item.dataHora }
    }
  }

  return null
}

function safeParseJson(raw: string): unknown {
  try { return JSON.parse(raw) } catch { return null }
}

/**
 * Busca a publicação de um edital por ação.
 *
 * - Retorna `exists: false` se o cronograma não tem item com essa ação.
 * - Retorna `visivel: false` se a data do marco ainda não chegou.
 * - Quando visível, retorna a lista ordenada por número de inscrição.
 *
 * **Não aplica máscara** — a camada de apresentação (página/route) decide
 * o que expor publicamente.
 */
export async function getPublicacao(
  slug: string,
  acao: AcaoPublicacao,
  now: Date = new Date(),
): Promise<PublicacaoResult | null> {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { id: true, status: true, cronograma: true },
  })

  if (!edital || edital.status === 'RASCUNHO') return null

  const label = PUBLICACAO_LABELS[acao]

  const marco = findMarco(edital.cronograma, acao)
  if (!marco) {
    return { exists: false, visivel: false, dataPublicacao: null, label, items: [] }
  }

  const dataMarco = parseBrazilDateTime(marco.dataHora)
  const visivel = !isNaN(dataMarco.getTime()) && dataMarco <= now

  if (!visivel) {
    return { exists: true, visivel: false, dataPublicacao: marco.dataHora, label, items: [] }
  }

  const ehResultado = isAcaoResultado(acao)

  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId: edital.id,
      status: { in: PUBLICACAO_STATUS_FILTER[acao] },
    },
    // Resultado: ordena pela classificação (posição/nota). Demais: por número.
    orderBy: ehResultado
      ? [{ posicao: { sort: 'asc', nulls: 'last' } }, { notaFinal: { sort: 'desc', nulls: 'last' } }]
      : { numero: 'asc' },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
    },
  })

  const items: PublicacaoItem[] = inscricoes.map((i) => ({
    numero: i.numero,
    nome: i.proponente.nome,
    cpfCnpj: i.proponente.cpfCnpj,
    categoria: i.categoria,
    status: i.status,
    posicao: ehResultado ? i.posicao : null,
    notaFinal: ehResultado && i.notaFinal != null ? Number(i.notaFinal) : null,
  }))

  return { exists: true, visivel: true, dataPublicacao: marco.dataHora, label, items }
}

/**
 * Lista todas as publicações configuradas no cronograma de um edital —
 * usado pela página de listagem pra rendezar links e pelo header de cronograma
 * pra injetar botões de download inline.
 */
export function listAcoesPublicacaoDoCronograma(
  cronograma: unknown,
): Array<{ acao: AcaoPublicacao; dataHora: string }> {
  // parseCronograma já normaliza e remove PUBLICADO, mas perde `acao`.
  // Trabalhamos no raw aqui pra preservar.
  const raw = (typeof cronograma === 'string'
    ? safeParseJson(cronograma)
    : cronograma) as CronogramaItem[] | null

  if (!Array.isArray(raw)) return []

  const result: Array<{ acao: AcaoPublicacao; dataHora: string }> = []
  for (const item of raw) {
    if (
      item
      && typeof item === 'object'
      && 'tipo' in item
      && item.tipo === 'custom'
      && isAcaoPublicacao(item.acao)
      && typeof item.dataHora === 'string'
      && item.dataHora.trim() !== ''
    ) {
      result.push({ acao: item.acao, dataHora: item.dataHora })
    }
  }

  return result
}

// Re-export para callers que querem o tipo sem importar do types
export { isAcaoPublicacao }
export type { AcaoPublicacao }
