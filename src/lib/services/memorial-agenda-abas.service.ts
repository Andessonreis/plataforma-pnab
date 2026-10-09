import type { MemorialStatusAgendamento, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { diaEmIrece, diaParaDate } from '@/lib/memorial/agendamento/datas'
import { STATUS_PENDENTES } from '@/lib/memorial/agendamento/status'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'
import { CAMPOS_CARTAO, filtroVisitas } from './memorial-agendamento-gestao.service'

/**
 * Leitura da agenda separada por tarefa da equipe. "Para responder" junta todos os
 * pedidos em aberto; "Confirmadas" só olha de hoje em diante, que é o que ainda vai acontecer.
 */

export const ABAS_AGENDA = ['responder', 'confirmadas', 'realizadas', 'todas'] as const
export type AbaAgenda = (typeof ABAS_AGENDA)[number]

const STATUS_DA_ABA: Record<Exclude<AbaAgenda, 'todas'>, readonly MemorialStatusAgendamento[]> = {
  responder: STATUS_PENDENTES,
  confirmadas: ['CONFIRMADO'],
  realizadas: ['REALIZADO', 'NAO_COMPARECEU'],
}

type FiltrosAba = Partial<Pick<ListarVisitasQuery, 'de' | 'ate' | 'status' | 'busca'>>

/** Filtro da aba somado aos filtros do painel. Na aba "Todas" vale a situação escolhida. */
export function filtroDaAba(aba: AbaAgenda, q: FiltrosAba, hoje: string): Prisma.MemorialAgendamentoWhereInput {
  if (aba === 'todas') return filtroVisitas(q)
  const where = filtroVisitas({ ...q, status: undefined })
  where.status = { in: [...STATUS_DA_ABA[aba]] }
  if (aba === 'confirmadas' && !q.de) {
    where.data = { ...(where.data as Prisma.DateTimeFilter | undefined), gte: diaParaDate(hoje) }
  }
  return where
}

/** Pedidos em aberto por ordem de chegada; o resto pela data da visita. Realizadas, da mais recente. */
export function ordemDaAba(aba: AbaAgenda): Prisma.MemorialAgendamentoOrderByWithRelationInput[] {
  if (aba === 'responder') return [{ createdAt: 'asc' }]
  if (aba === 'realizadas') return [{ data: 'desc' }, { horaInicio: 'desc' }]
  return [{ data: 'asc' }, { horaInicio: 'asc' }]
}

export async function listarAba(aba: AbaAgenda, q: ListarVisitasQuery, agora = new Date()) {
  const where = filtroDaAba(aba, q, diaEmIrece(agora))
  const [itens, total] = await Promise.all([
    prisma.memorialAgendamento.findMany({
      where,
      orderBy: ordemDaAba(aba),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: { ...CAMPOS_CARTAO, createdAt: true },
    }),
    prisma.memorialAgendamento.count({ where }),
  ])
  return { itens, total }
}

export type ContagemAbas = Record<AbaAgenda, number>

/** Números das abas, contados com a mesma regra de cada uma. */
export async function contarAbas(agora = new Date()): Promise<ContagemAbas> {
  const hoje = diaEmIrece(agora)
  const contar = (aba: AbaAgenda) => prisma.memorialAgendamento.count({ where: filtroDaAba(aba, {}, hoje) })
  const valores = await Promise.all(ABAS_AGENDA.map(contar))
  return Object.fromEntries(ABAS_AGENDA.map((aba, i) => [aba, valores[i]])) as ContagemAbas
}
