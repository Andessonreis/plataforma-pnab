import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { toCsv } from '@/lib/export/csv'
import { formatTelefoneBR } from '@/lib/utils/format'
import { dateParaDia, diaEmIrece, diaParaDate, formatarDiaCurto, intervaloDoMes } from '@/lib/memorial/agendamento/datas'
import { montarRelatorio } from '@/lib/memorial/agendamento/relatorio'
import { ROTULO_STATUS, ROTULO_TURNO, STATUS_PENDENTES } from '@/lib/memorial/agendamento/status'
import { filtroVisitas } from './memorial-agendamento-gestao.service'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'

/** Um ano de pedidos cabe com folga; acima disso o período pedido é grande demais. */
const TETO_LINHAS = 5000

export async function relatorioVisitas(de: string, ate: string) {
  const linhas = await prisma.memorialAgendamento.findMany({
    where: { data: { gte: diaParaDate(de), lte: diaParaDate(ate) } },
    select: { status: true, tipoVisitante: true, faixaEtaria: true, quantidade: true, turno: true, horaInicio: true },
    take: TETO_LINHAS,
  })
  return { de, ate, ...montarRelatorio(linhas) }
}

/** Números do cartão do painel: hoje, pendentes, confirmadas à frente e o mês corrente. */
export async function resumoAgendamentos(agora = new Date()) {
  const hoje = diaEmIrece(agora)
  const mes = intervaloDoMes(hoje.slice(0, 7))
  const naAgenda = { in: ['CONFIRMADO', 'REALIZADO'] as ('CONFIRMADO' | 'REALIZADO')[] }

  const [visitasHoje, pendentes, confirmadas, doMes] = await Promise.all([
    prisma.memorialAgendamento.aggregate({
      where: { data: diaParaDate(hoje), status: naAgenda },
      _count: true,
      _sum: { quantidade: true },
    }),
    prisma.memorialAgendamento.count({ where: { status: { in: [...STATUS_PENDENTES] } } }),
    prisma.memorialAgendamento.count({ where: { status: 'CONFIRMADO', data: { gte: diaParaDate(hoje) } } }),
    prisma.memorialAgendamento.aggregate({
      where: { data: { gte: diaParaDate(mes.de), lte: diaParaDate(mes.ate) }, status: naAgenda },
      _count: true,
      _sum: { quantidade: true },
    }),
  ])

  return {
    visitasHoje: visitasHoje._count,
    visitantesHoje: visitasHoje._sum.quantidade ?? 0,
    pendentes,
    confirmadas,
    visitasMes: doMes._count,
    visitantesMes: doMes._sum.quantidade ?? 0,
  }
}

const CABECALHO = [
  'Protocolo', 'Data', 'Turno', 'Horário', 'Situação', 'Tipo de visitante', 'Instituição', 'Pessoas',
  'Faixa etária', 'Ano/turma', 'Cidade', 'Responsável', 'Cargo', 'E-mail', 'Telefone',
  'Preferência de contato', 'Observações', 'Necessidades específicas', 'Motivo (recusa/cancelamento)', 'Pedido em',
]

export async function exportarVisitasCsv(q: Partial<ListarVisitasQuery>, userId: string, ip?: string) {
  const visitas = await prisma.memorialAgendamento.findMany({
    where: filtroVisitas(q),
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
    take: TETO_LINHAS,
  })

  const linhas = visitas.map((v) => [
    v.protocolo,
    formatarDiaCurto(dateParaDia(v.data)),
    ROTULO_TURNO[v.turno],
    `${v.horaInicio}–${v.horaFim}`,
    ROTULO_STATUS[v.status],
    v.tipoVisitante,
    v.instituicao,
    v.quantidade,
    v.faixaEtaria,
    v.turma,
    v.cidade,
    v.responsavelNome,
    v.responsavelCargo,
    v.responsavelEmail,
    formatTelefoneBR(v.responsavelTelefone),
    v.preferenciaContato,
    v.observacoes,
    v.necessidades,
    v.motivoRecusa,
    v.createdAt.toISOString(),
  ])

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPORTACAO_CSV,
    entity: 'MemorialAgendamento',
    details: { filtro: { de: q.de, ate: q.ate, status: q.status }, total: visitas.length },
    ip,
  })

  return toCsv([CABECALHO, ...linhas])
}
