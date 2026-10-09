import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { getConfig } from '@/lib/memorial/config'
import { dateParaDia, diaParaDate } from '@/lib/memorial/agendamento/datas'
import { mensagemIndisponivel, motivoIndisponivel } from '@/lib/memorial/agendamento/regras'
import { STATUS_REAGENDAVEIS, statusAposAcao } from '@/lib/memorial/agendamento/status'
import { ocupacoesNoIntervalo, travarDia } from '@/lib/memorial/agendamento/ocupacao'
import { avisarConfirmacao, avisarRecusa } from '@/lib/memorial/agendamento/notificar'
import { ServiceError } from './errors'
import type { DecidirVisitaInput, ListarVisitasQuery, ReagendarVisitaInput } from '@/lib/schemas/memorial-agendamento'

/** Filtro comum à lista, ao calendário e ao CSV. */
export function filtroVisitas(q: Partial<Pick<ListarVisitasQuery, 'de' | 'ate' | 'status' | 'busca'>>): Prisma.MemorialAgendamentoWhereInput {
  const where: Prisma.MemorialAgendamentoWhereInput = {}
  if (q.de || q.ate) {
    where.data = { ...(q.de ? { gte: diaParaDate(q.de) } : {}), ...(q.ate ? { lte: diaParaDate(q.ate) } : {}) }
  }
  if (q.status) where.status = q.status
  if (q.busca) {
    const contains = { contains: q.busca, mode: 'insensitive' as const }
    where.OR = [{ protocolo: contains }, { instituicao: contains }, { responsavelNome: contains }, { responsavelEmail: contains }]
  }
  return where
}

const CAMPOS_CARTAO = {
  id: true,
  protocolo: true,
  status: true,
  data: true,
  turno: true,
  horaInicio: true,
  horaFim: true,
  instituicao: true,
  tipoVisitante: true,
  quantidade: true,
  responsavelNome: true,
  responsavelTelefone: true,
  responsavelEmail: true,
} satisfies Prisma.MemorialAgendamentoSelect

export async function listarVisitas(q: ListarVisitasQuery) {
  const where = filtroVisitas(q)
  const [itens, total] = await Promise.all([
    prisma.memorialAgendamento.findMany({
      where,
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: CAMPOS_CARTAO,
    }),
    prisma.memorialAgendamento.count({ where }),
  ])
  return { itens, total }
}

/** Calendário: o intervalo já vem limitado a uma tela (mês/semana/dia), então o teto é folgado. */
export async function listarCalendario(de: string, ate: string, filtros: Pick<Partial<ListarVisitasQuery>, 'status' | 'busca'> = {}) {
  return prisma.memorialAgendamento.findMany({
    where: filtroVisitas({ ...filtros, de, ate }),
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
    take: 500,
    select: CAMPOS_CARTAO,
  })
}

export async function obterVisita(id: string) {
  const visita = await prisma.memorialAgendamento.findUnique({
    where: { id },
    include: { resposta: { select: { camposSnapshot: true, dados: true } } },
  })
  if (!visita) throw new ServiceError('NOT_FOUND', 'Visita não encontrada.')
  return visita
}

export async function decidirVisita(id: string, input: DecidirVisitaInput, userId: string, ip?: string) {
  const atual = await obterVisita(id)
  const novoStatus = statusAposAcao(atual.status, input.acao)
  if (!novoStatus) throw new ServiceError('CONFLICT', 'Essa ação não se aplica à situação atual da visita.')

  const comMotivo = novoStatus === 'RECUSADO' || novoStatus === 'CANCELADO'
  const visita = await prisma.memorialAgendamento.update({
    where: { id },
    data: {
      status: novoStatus,
      motivoRecusa: comMotivo ? input.motivo : atual.motivoRecusa,
      decididoPorId: userId,
      decididoEm: new Date(),
    },
  })

  const decisao = novoStatus === 'CONFIRMADO' || novoStatus === 'RECUSADO'
  await logAudit({
    userId,
    action: decisao ? AUDIT_ACTIONS.MEMORIAL_AGENDAMENTO_DECIDIDO : AUDIT_ACTIONS.MEMORIAL_AGENDAMENTO_ATUALIZADO,
    entity: 'MemorialAgendamento',
    entityId: id,
    details: { protocolo: visita.protocolo, de: atual.status, para: novoStatus },
    ip,
  })

  if (novoStatus === 'CONFIRMADO') await avisarConfirmacao(visita)
  if (novoStatus === 'RECUSADO') await avisarRecusa(visita, 'RECUSADA', input.motivo!)
  if (novoStatus === 'CANCELADO') await avisarRecusa(visita, 'CANCELADA', input.motivo!)

  return visita
}

/**
 * Remarca uma visita em aberto ou confirmada. A equipe pode remarcar em cima da hora,
 * mas não por cima de outro grupo nem fora da grade.
 */
export async function reagendarVisita(id: string, input: ReagendarVisitaInput, userId: string, ip?: string) {
  const atual = await obterVisita(id)
  if (!STATUS_REAGENDAVEIS.includes(atual.status)) {
    throw new ServiceError('CONFLICT', 'Só dá para remarcar visitas em aberto ou confirmadas.')
  }
  const regras = await getConfig('visitacao')

  const visita = await prisma.$transaction(async (tx) => {
    await travarDia(tx, input.data)
    const ocupacoes = await ocupacoesNoIntervalo(tx, input.data, input.data, id)
    // O tamanho do grupo já foi aceito no pedido e a remarcação não mexe nele, por isso
    // a quantidade não entra na conferência.
    const motivo = motivoIndisponivel({ ...input, quantidade: 1 }, ocupacoes, regras, new Date(), {
      ignorarAntecedencia: true,
    })
    if (motivo) throw new ServiceError('CONFLICT', mensagemIndisponivel(motivo, regras))

    return tx.memorialAgendamento.update({
      where: { id },
      data: { data: diaParaDate(input.data), turno: input.turno, horaInicio: input.horaInicio, horaFim: input.horaFim },
    })
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.MEMORIAL_AGENDAMENTO_ATUALIZADO,
    entity: 'MemorialAgendamento',
    entityId: id,
    details: {
      protocolo: visita.protocolo,
      de: { data: dateParaDia(atual.data), horaInicio: atual.horaInicio },
      para: { data: input.data, horaInicio: input.horaInicio },
    },
    ip,
  })

  await avisarConfirmacao(visita, true)
  return visita
}
