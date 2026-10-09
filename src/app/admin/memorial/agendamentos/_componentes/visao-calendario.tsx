import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@/components/ui'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { listarCalendario } from '@/lib/services/memorial-agendamento-gestao.service'
import { dateParaDia, diaEmIrece, diasEntre, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import type { ListarVisitasQuery } from '@/lib/schemas/memorial-agendamento'
import { CartaoVisita, type VisitaCartao } from './cartao-visita'
import { GradeMes } from './grade-mes'
import { deslocar, periodoDaEscala, tituloDoPeriodo, type Escala } from './periodo-calendario'

interface VisaoCalendarioProps {
  escala: Escala
  referencia?: string
  status?: ListarVisitasQuery['status']
  busca?: string
}

const NAV =
  'inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Agenda por mês, semana ou dia. No celular tudo vira lista por dia; a grade do mês só aparece no desktop. */
export async function VisaoCalendario({ escala, referencia, status, busca }: VisaoCalendarioProps) {
  const hoje = diaEmIrece(new Date())
  const dia = referencia ?? hoje
  const { de, ate } = periodoDaEscala(escala, dia)
  const visitas = await listarCalendario(de, ate, { status, busca })

  const porDia = new Map<string, VisitaCartao[]>()
  for (const v of visitas) {
    const chave = dateParaDia(v.data)
    porDia.set(chave, [...(porDia.get(chave) ?? []), v])
  }
  const url = (r: string) => montarUrl('/admin/memorial/agendamentos', { visao: 'calendario', escala, ref: r, status, busca })
  // No mês só entram os dias com visita; semana e dia mostram todos, até os vazios.
  const diasMostrados = escala === 'mes' ? diasEntre(de, ate).filter((d) => porDia.has(d)) : diasEntre(de, ate)

  return (
    <section aria-label="Calendário de visitas">
      <div className="mb-4 flex items-center gap-2">
        <Link href={url(deslocar(escala, dia, -1))} className={NAV} aria-label="Período anterior">
          <IconChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="min-w-0 flex-1 text-center text-base font-semibold capitalize text-slate-900 sm:text-lg" aria-live="polite">
          {tituloDoPeriodo(escala, dia)}
        </h2>
        <Link href={url(deslocar(escala, dia, 1))} className={NAV} aria-label="Próximo período">
          <IconChevronRight className="h-4 w-4" />
        </Link>
        <Link href={url(hoje)} className={NAV}>
          Hoje
        </Link>
      </div>

      {escala === 'mes' && <GradeMes de={de} ate={ate} hoje={hoje} porDia={porDia} urlDoDia={(d) => montarUrl('/admin/memorial/agendamentos', { visao: 'calendario', escala: 'dia', ref: d, status })} />}

      <div className={escala === 'mes' ? 'lg:hidden' : ''}>
        {visitas.length === 0 && escala === 'mes' ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Nenhuma visita neste período.
          </p>
        ) : (
          <ol className={escala === 'semana' ? 'space-y-5 lg:grid lg:grid-cols-7 lg:gap-3 lg:space-y-0' : 'space-y-5'}>
            {diasMostrados.map((d) => (
              <li key={d}>
                <h3 className={`mb-2 text-sm font-semibold ${d === hoje ? 'text-brand-700' : 'text-slate-700'}`}>
                  {formatarDiaPorExtenso(d)}
                </h3>
                <div className="space-y-2">
                  {(porDia.get(d) ?? []).map((v) => (
                    <CartaoVisita key={v.id} visita={v} comData={false} compacto={escala === 'semana'} />
                  ))}
                  {!porDia.has(d) && <p className="text-xs text-slate-500">Sem visitas.</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
