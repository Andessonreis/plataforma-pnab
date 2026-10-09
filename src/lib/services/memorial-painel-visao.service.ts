import type { MemorialStatusAgendamento } from '@prisma/client'
import { prisma } from '@/lib/db'
import { dateParaDia, diaEmIrece, diasEntre, somarDias } from '@/lib/memorial/agendamento/datas'
import { STATUS_PENDENTES } from '@/lib/memorial/agendamento/status'
import { CAMPOS_CARTAO, listarCalendario } from './memorial-agendamento-gestao.service'

/** Leituras da tela "Hoje no Memorial": o que pede resposta, a semana, o acervo e o que está no ar. */

/** Pedidos sem resposta, do mais antigo ao mais novo, e quantos são no total. */
export async function pedidosParaResponder(limite = 5) {
  const where = { status: { in: [...STATUS_PENDENTES] } }
  const [itens, total] = await Promise.all([
    prisma.memorialAgendamento.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limite,
      select: { ...CAMPOS_CARTAO, createdAt: true },
    }),
    prisma.memorialAgendamento.count({ where }),
  ])
  return { itens, total }
}

/** Na semana entram as visitas que seguram horário e as que já aconteceram hoje. */
const STATUS_DA_SEMANA: readonly MemorialStatusAgendamento[] = [
  'SOLICITADO',
  'EM_ANALISE',
  'REAGENDAMENTO_SOLICITADO',
  'CONFIRMADO',
  'REALIZADO',
]

export interface DiaDaSemana<V> {
  dia: string
  visitas: V[]
}

/** Agrupa as visitas nos dias pedidos, mantendo os dias vazios para a semana aparecer inteira. */
export function montarSemana<V extends { data: Date; status: MemorialStatusAgendamento }>(
  dias: string[],
  visitas: V[],
): DiaDaSemana<V>[] {
  return dias.map((dia) => ({
    dia,
    visitas: visitas.filter((v) => dateParaDia(v.data) === dia && STATUS_DA_SEMANA.includes(v.status)),
  }))
}

/** Hoje e os seis dias seguintes. */
export async function proximosSeteDias(agora = new Date()) {
  const hoje = diaEmIrece(agora)
  const ate = somarDias(hoje, 6)
  const visitas = await listarCalendario(hoje, ate)
  return { hoje, dias: montarSemana(diasEntre(hoje, ate), visitas) }
}

/** Últimas fotografias que entraram no acervo, com o necessário para a miniatura. */
export function fotosRecentes(limite = 8) {
  return prisma.memorialAcervoItem.findMany({
    where: { tipo: 'FOTOGRAFIA' },
    orderBy: { createdAt: 'desc' },
    take: limite,
    select: {
      id: true,
      titulo: true,
      status: true,
      decada: true,
      autorizado: true,
      credito: true,
      arquivoUrl: true,
      versaoWebUrl: true,
    },
  })
}

/** Exposições publicadas, na mesma ordem do site. */
export function exposicoesNoAr(limite = 3) {
  return prisma.memorialExposicao.findMany({
    where: { status: 'PUBLICADO' },
    orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { dataInicio: 'desc' }],
    take: limite,
    select: { id: true, titulo: true, subtitulo: true, periodo: true, capaUrl: true, slug: true },
  })
}
