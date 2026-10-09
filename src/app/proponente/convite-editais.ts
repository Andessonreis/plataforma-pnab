import type { EditalStatus } from '@prisma/client'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { getStatusDisplay } from '@/lib/utils/edital-status'
import { compararDataHora } from './prazos'

/** Edital publicado e ainda não encerrado, como `carregarPainel` o entrega. */
export interface EditalVigente {
  id: string
  titulo: string
  slug: string
  status: EditalStatus
  cronograma: unknown
  valorTotal: number | null
}

export interface ItemConvite {
  editalId: string
  titulo: string
  slug: string
  /** Fase do edital em palavras ("Em Avaliação"); vazia nos abertos, que o título já anuncia. */
  situacao: string | null
  /** Próximo marco do cronograma; nulo quando o edital não tem data futura cadastrada. */
  marco: { label: string; dataHora: string } | null
  valorTotal: number | null
}

/**
 * - `abertos`: há editais recebendo inscrições;
 * - `proximos`: nenhum aberto, mas há editais publicados ou em andamento;
 * - `nenhum`: nada em andamento no portal.
 */
export type SituacaoConvite = 'abertos' | 'proximos' | 'nenhum'

export interface ConviteEditais {
  situacao: SituacaoConvite
  itens: ItemConvite[]
}

const LIMITE_ITENS = 3

/** Com data primeiro (a mais próxima antes); sem data no fim. */
function porMarco(a: ItemConvite, b: ItemConvite): number {
  if (a.marco && b.marco) return compararDataHora(a.marco.dataHora, b.marco.dataHora)
  return a.marco ? -1 : b.marco ? 1 : 0
}

function paraItem(edital: EditalVigente, aberto: boolean): ItemConvite {
  const marco = getNextDeadline(edital.cronograma)
  return {
    editalId: edital.id,
    titulo: edital.titulo,
    slug: edital.slug,
    situacao: aberto ? null : getStatusDisplay(edital.status).label,
    marco: marco ? { label: marco.label, dataHora: marco.dataHora } : null,
    valorTotal: edital.valorTotal,
  }
}

/**
 * Convite a editais que ocupa o lugar do bloco "agora" para quem ainda não
 * se inscreveu em nada: o "agora" dessa conta seria só "nada pendente".
 * Quem já participa de editais continua com o "agora" (devolve `null`).
 * Sem edital aberto, os publicados (inscrições por abrir) vêm antes dos que
 * já estão em fases seguintes, porque são os únicos em que ainda dá para entrar.
 */
export function resolverConviteEditais(totalInscricoes: number, editais: EditalVigente[]): ConviteEditais | null {
  if (totalInscricoes > 0) return null

  const abertos = editais.filter((e) => e.status === 'INSCRICOES_ABERTAS')
  if (abertos.length > 0) {
    return { situacao: 'abertos', itens: abertos.map((e) => paraItem(e, true)).sort(porMarco).slice(0, LIMITE_ITENS) }
  }

  if (editais.length === 0) return { situacao: 'nenhum', itens: [] }

  const publicados = editais.filter((e) => e.status === 'PUBLICADO').map((e) => paraItem(e, false)).sort(porMarco)
  const emAndamento = editais.filter((e) => e.status !== 'PUBLICADO').map((e) => paraItem(e, false)).sort(porMarco)
  return { situacao: 'proximos', itens: [...publicados, ...emAndamento].slice(0, LIMITE_ITENS) }
}
