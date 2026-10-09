import { Prisma, type PrismaClient } from '@prisma/client'
import { dateParaDia, diaParaDate } from './datas'
import { STATUS_QUE_OCUPAM, type Ocupacao } from './regras'

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Trava o dia até o fim da transação. Dois pedidos para o mesmo dia passam por aqui
 * em fila, então o segundo já enxerga a vaga tomada pelo primeiro — sem isso os dois
 * leriam o dia vazio e gravariam juntos.
 */
export async function travarDia(tx: Prisma.TransactionClient, dia: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`memorial-visita:${dia}`}))`
}

/** Visitas que seguram vaga no intervalo, opcionalmente ignorando uma (a que está sendo remarcada). */
export async function ocupacoesNoIntervalo(db: Db, de: string, ate: string, excetoId?: string): Promise<Ocupacao[]> {
  const linhas = await db.memorialAgendamento.findMany({
    where: {
      data: { gte: diaParaDate(de), lte: diaParaDate(ate) },
      status: { in: [...STATUS_QUE_OCUPAM] },
      ...(excetoId ? { id: { not: excetoId } } : {}),
    },
    select: { data: true, turno: true, horaInicio: true, status: true },
  })
  return linhas.map((l) => ({ ...l, data: dateParaDia(l.data) }))
}

/**
 * Violação do índice único "MemorialAgendamento_horario_ativo_key" (data + início, só
 * para pedidos que seguram vaga). Com a trava do dia isso não deveria acontecer; se
 * acontecer, quem chegou depois recebe o mesmo aviso de horário ocupado.
 */
export function ehConflitoDeHorario(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') return false
  const alvo = JSON.stringify(err.meta?.target ?? '')
  return alvo.includes('horaInicio') || alvo.includes('horario_ativo')
}
