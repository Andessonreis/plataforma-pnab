import Link from 'next/link'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@/components/ui'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { StatusChip, VazioAcionavel } from '@/app/admin/memorial/_ui'
import { SemanaVisitas } from '@/app/admin/memorial/_ui/agenda-semana'
import { VisitaLinha, type VisitaCartao } from '@/app/admin/memorial/_ui/agenda-visita'
import { listarCalendario } from '@/lib/services/memorial-agendamento-gestao.service'
import { dateParaDia, diaEmIrece, diasEntre } from '@/lib/memorial/agendamento/datas'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'
import { GradeMes } from './grade-mes'
import { deslocar, periodoDaEscala, tituloDoPeriodo, type Escala } from './periodo-calendario'

interface VisaoCalendarioProps {
  escala: Escala
  referencia?: string
  status?: ListarVisitasQuery['status']
  busca?: string
}

const BASE = '/admin/memorial/agendamentos'
const NAV =
  'inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-tinta-900/20 bg-white px-3 text-sm font-semibold text-tinta-800 hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-accent-500'
const ESCALAS: [Escala, string][] = [
  ['mes', 'Mês'],
  ['semana', 'Semana'],
  ['dia', 'Dia'],
]
const LEGENDA = ['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'REALIZADO'] as const

/** Agenda por mês, semana ou dia. A grade do mês só aparece no desktop; no celular vira lista de dias. */
export async function VisaoCalendario({ escala, referencia, status, busca }: VisaoCalendarioProps) {
  const hoje = diaEmIrece(new Date())
  const dia = referencia ?? hoje
  const { de, ate } = periodoDaEscala(escala, dia)
  const visitas: VisitaCartao[] = await listarCalendario(de, ate, { status, busca })

  const porDia = new Map<string, VisitaCartao[]>()
  for (const v of visitas) {
    const chave = dateParaDia(v.data)
    porDia.set(chave, [...(porDia.get(chave) ?? []), v])
  }
  const url = (e: Escala, r: string) => montarUrl(BASE, { visao: 'calendario', escala: e, ref: r, status, busca })
  const urlDoDia = (d: string) => url('dia', d)
  const todos = diasEntre(de, ate).map((d) => ({ dia: d, visitas: porDia.get(d) ?? [] }))

  return (
    <section aria-label="Calendário de visitas" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label="Tamanho do período" className="inline-flex rounded-lg border border-tinta-900/20 bg-white p-1">
          {ESCALAS.map(([e, rotulo]) => (
            <Link
              key={e}
              href={url(e, dia)}
              aria-current={e === escala ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent-500 ${
                e === escala ? 'bg-accent-500 text-tinta-950' : 'text-tinta-700 hover:bg-papel-100'
              }`}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center gap-2">
          <Link href={url(escala, deslocar(escala, dia, -1))} className={NAV} aria-label="Período anterior">
            <IconChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="min-w-0 flex-1 text-center text-base font-bold text-tinta-900 first-letter:uppercase sm:text-lg" aria-live="polite">
            {tituloDoPeriodo(escala, dia)}
          </h2>
          <Link href={url(escala, deslocar(escala, dia, 1))} className={NAV} aria-label="Próximo período">
            <IconChevronRight className="h-4 w-4" />
          </Link>
          <Link href={url(escala, hoje)} className={NAV}>
            Hoje
          </Link>
        </div>
      </div>

      <ul aria-label="O que cada cor quer dizer" className="flex flex-wrap gap-2">
        {LEGENDA.map((s) => (
          <li key={s}>
            <StatusChip tipo="visita" status={s} />
          </li>
        ))}
      </ul>

      {visitas.length === 0 && escala !== 'semana' ? (
        <VazioAcionavel
          icone={<IconCalendar className="h-6 w-6" />}
          titulo="Nenhuma visita neste período"
          texto="Use as setas para ver outro período ou volte para hoje."
        />
      ) : escala === 'dia' ? (
        <ul className="divide-y divide-tinta-900/10 overflow-hidden rounded-xl border border-tinta-900/15 bg-white">
          {visitas.map((v) => (
            <VisitaLinha key={v.id} visita={v} hoje={hoje} />
          ))}
        </ul>
      ) : (
        <>
          {escala === 'mes' && <GradeMes de={de} ate={ate} hoje={hoje} porDia={porDia} urlDoDia={urlDoDia} />}
          <div className={`rounded-xl border border-tinta-900/15 bg-white px-4 lg:px-0 ${escala === 'mes' ? 'lg:hidden' : ''}`}>
            <SemanaVisitas dias={escala === 'mes' ? todos.filter((d) => d.visitas.length > 0) : todos} hoje={hoje} urlDoDia={urlDoDia} />
          </div>
        </>
      )}
    </section>
  )
}
