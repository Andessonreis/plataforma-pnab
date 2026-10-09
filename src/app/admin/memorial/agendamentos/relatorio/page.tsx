import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoAdmin } from '@/app/admin/memorial/_componentes/cabecalho-admin'
import { lerFiltros } from '@/app/admin/memorial/_componentes/parametros'
import { relatorioVisitas } from '@/lib/services/memorial-agendamento-relatorio.service'
import { relatorioQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { diaEmIrece, intervaloDoMes } from '@/lib/memorial/agendamento/datas'
import { TabelaGrupos } from './tabela-grupos'

export const metadata: Metadata = { title: 'Relatório de visitas — Memorial' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const CAMPO = 'mt-1 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm'

export default async function RelatorioVisitasPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const mes = intervaloDoMes(diaEmIrece(new Date()).slice(0, 7))
  const busca = await searchParams
  const { de, ate } = lerFiltros(relatorioQuerySchema.catch(mes), busca)
  const r = await relatorioVisitas(de, ate)

  const numeros: [string, string][] = [
    ['Pedidos no período', String(r.pedidos)],
    ['Visitas na agenda', String(r.visitas)],
    ['Visitantes previstos', String(r.visitantes)],
    ['Visitas realizadas', String(r.realizadas)],
    ['Visitantes atendidos', String(r.visitantesRealizados)],
    ['Comparecimento', r.taxaComparecimento === null ? '—' : `${Math.round(r.taxaComparecimento * 100)}%`],
    ['Cancelamentos', String(r.cancelamentos)],
    ['Recusas', String(r.recusas)],
  ]

  return (
    <section>
      <CabecalhoAdmin
        titulo="Relatório de visitas"
        descricao="Visitas na agenda são as confirmadas e as já realizadas. Comparecimento compara realizadas com faltas."
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agendamentos' }}
      />

      <form className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-medium text-slate-600">
          De
          <input type="date" name="de" defaultValue={de} className={CAMPO} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Até
          <input type="date" name="ate" defaultValue={ate} className={CAMPO} />
        </label>
        <button type="submit" className="min-h-[44px] rounded-lg bg-slate-800 px-5 text-sm font-medium text-white hover:bg-slate-900">
          Ver período
        </button>
      </form>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {numeros.map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl border border-slate-200 bg-white p-3">
            <dt className="text-xs text-slate-600">{rotulo}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <TabelaGrupos titulo="Por tipo de visitante" coluna="Tipo" grupos={r.porTipoVisitante} />
        <TabelaGrupos titulo="Por faixa etária" coluna="Faixa" grupos={r.porFaixaEtaria} />
        <TabelaGrupos titulo="Horários mais usados" coluna="Início" grupos={r.porHorario} />
      </div>
    </section>
  )
}
