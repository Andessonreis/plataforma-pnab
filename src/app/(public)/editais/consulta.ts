import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getStatusDisplay, OPEN_STATUSES, CLOSED_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'
import type { ChaveAba } from './abas-status'
import type { EditalListado } from './linha-edital'

/** Só os encerrados paginam: os abertos são poucos e cabem todos na abertura. */
export const PAGE_SIZE = 12

const MS_POR_DIA = 86_400_000

/** Corta no último espaço para não terminar no meio de uma palavra. */
function resumir(texto: string, limite: number): string {
  if (texto.length <= limite) return texto
  const corte = texto.slice(0, limite)
  const ultimoEspaco = corte.lastIndexOf(' ')
  return (ultimoEspaco > 0 ? corte.slice(0, ultimoEspaco) : corte) + '...'
}

type EditalPrisma = Awaited<ReturnType<typeof prisma.edital.findMany>>[number]

function paraListagem(edital: EditalPrisma): EditalListado {
  const prazo = getNextDeadline(edital.cronograma)
  return {
    id: edital.id,
    slug: edital.slug,
    titulo: edital.titulo,
    resumo: edital.resumo ? resumir(edital.resumo, 170) : null,
    categorias: edital.categorias.slice(0, 3),
    status: edital.status,
    statusLabel: getStatusDisplay(edital.status).label,
    aberto: OPEN_STATUSES.includes(edital.status),
    prazoRotulo: prazo?.label ?? null,
    prazoData: prazo ? formatDate(prazo.dataHora) : null,
    diasRestantes: prazo
      ? Math.max(0, Math.ceil((new Date(prazo.dataHora).getTime() - Date.now()) / MS_POR_DIA))
      : null,
    valor: edital.valorTotal ? formatCurrency(edital.valorTotal) : null,
  }
}

export interface ResultadoEditais {
  abertos: EditalListado[]
  demais: EditalListado[]
  totalPaginas: number
  publicados: number
  /** Menor prazo entre os abertos, para a chamada de urgência da abertura. */
  proximo: { titulo: string; dias: number } | null
}

/**
 * Abertos e demais são consultados em separado, de propósito.
 *
 * Os abertos vêm inteiros e fora da paginação: com uma lista única, um edital
 * recebendo propostas poderia cair na página 3 e sumir justamente de quem
 * entrou para se inscrever. Os encerrados paginam porque crescem para sempre.
 */
export async function consultarEditais(
  aba: ChaveAba,
  pagina: number,
): Promise<ResultadoEditais> {
  const mostraAbertos = aba !== 'encerrados'
  const whereDemais = {
    status:
      aba === 'encerrados'
        ? { in: CLOSED_STATUSES }
        : { notIn: [...OPEN_STATUSES, 'RASCUNHO' as EditalStatus] },
  }

  const [abertosRaw, demaisRaw, totalDemais, publicados] = await Promise.all([
    mostraAbertos
      ? prisma.edital.findMany({
          where: { status: { in: OPEN_STATUSES } },
          orderBy: [{ createdAt: 'desc' }],
        })
      : Promise.resolve([]),
    aba === 'abertos'
      ? Promise.resolve([])
      : prisma.edital.findMany({
          where: whereDemais,
          orderBy: [{ createdAt: 'desc' }],
          skip: (pagina - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
    aba === 'abertos' ? Promise.resolve(0) : prisma.edital.count({ where: whereDemais }),
    prisma.edital.count({ where: { status: { not: 'RASCUNHO' as EditalStatus } } }),
  ])

  const abertos = abertosRaw.map(paraListagem)
  const comPrazo = abertos.filter((e) => e.diasRestantes !== null)
  const maisProximo = comPrazo.length
    ? comPrazo.reduce((menor, e) => (e.diasRestantes! < menor.diasRestantes! ? e : menor))
    : null

  return {
    abertos,
    demais: demaisRaw.map(paraListagem),
    totalPaginas: Math.max(1, Math.ceil(totalDemais / PAGE_SIZE)),
    publicados,
    proximo: maisProximo ? { titulo: maisProximo.titulo, dias: maisProximo.diasRestantes! } : null,
  }
}
