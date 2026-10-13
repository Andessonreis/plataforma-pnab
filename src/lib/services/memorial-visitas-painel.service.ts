import { prisma } from '@/lib/db'
import { diaEmIrece, diaParaDate } from '@/lib/memorial/agendamento/datas'
import { separarVisitas } from '@/lib/memorial/agendamento/proximas-visitas'
import { STATUS_ATIVOS } from '@/lib/memorial/agendamento/status'
import { SELECT_MINHA_VISITA } from './memorial-agendamento.service'

/** Quantas visitas por vir o painel percorre; o resto fica em "Minhas visitas". */
const LIMITE_PROXIMAS = 5

/**
 * Visitas da conta para o painel do proponente: as que ainda vão acontecer,
 * da mais próxima para a mais distante, e a mais recente das demais.
 *
 * O banco recorta pelo dia de Irecê (pedidos ativos de hoje em diante, mais
 * os mais recentes até hoje fora desse recorte); a hora exata de hoje é
 * decidida por `separarVisitas`, porque `data` é só o dia (@db.Date).
 */
export async function listarVisitasDoPainel(userId: string, agora = new Date()) {
  const hoje = diaParaDate(diaEmIrece(agora))
  const porVir = { status: { in: [...STATUS_ATIVOS] }, data: { gte: hoje } }

  const [candidatas, anteriores, total] = await Promise.all([
    prisma.memorialAgendamento.findMany({
      where: { userId, ...porVir },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      take: LIMITE_PROXIMAS + 1,
      select: SELECT_MINHA_VISITA,
    }),
    // Até hoje inclusive. As de hoje que ainda não começaram são descartadas
    // depois, por isso vêm algumas a mais: sobra a anterior a elas.
    prisma.memorialAgendamento.findMany({
      where: { userId, data: { lte: hoje }, NOT: porVir },
      orderBy: [{ data: 'desc' }, { horaInicio: 'desc' }],
      take: 3,
      select: SELECT_MINHA_VISITA,
    }),
    prisma.memorialAgendamento.count({ where: { userId } }),
  ])

  const { proximas, ultima } = separarVisitas([...candidatas, ...anteriores], agora)
  return { proximas: proximas.slice(0, LIMITE_PROXIMAS), ultima, total }
}
