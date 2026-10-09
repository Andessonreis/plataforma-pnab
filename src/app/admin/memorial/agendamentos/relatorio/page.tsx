import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { lerFiltros } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { relatorioVisitas } from '@/lib/services/memorial-agendamento-relatorio.service'
import { relatorioQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { diaEmIrece, formatarDiaCurto, intervaloDoMes, somarDias } from '@/lib/memorial/agendamento/datas'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { TabelaGrupos } from './tabela-grupos'
import { PeriodoRelatorio } from './periodo-relatorio'

export const metadata: Metadata = { title: 'Relatório de visitas — Memorial' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Períodos que a equipe mais pede para prestar contas. */
function atalhosDePeriodo(hoje: string) {
  const mes = intervaloDoMes(hoje.slice(0, 7))
  const anterior = intervaloDoMes(somarDias(mes.de, -1).slice(0, 7))
  const ano = hoje.slice(0, 4)
  return [
    { rotulo: 'Este mês', ...mes },
    { rotulo: 'Mês passado', ...anterior },
    { rotulo: `Ano de ${ano}`, de: `${ano}-01-01`, ate: `${ano}-12-31` },
  ]
}

export default async function RelatorioVisitasPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const hoje = diaEmIrece(new Date())
  const mes = intervaloDoMes(hoje.slice(0, 7))
  const { de, ate } = lerFiltros(relatorioQuerySchema.catch(mes), await searchParams)
  const r = await relatorioVisitas(de, ate)

  const detalhes: [string, string][] = [
    ['Visitas realizadas', String(r.realizadas)],
    ['Visitantes atendidos', String(r.visitantesRealizados)],
    ['Comparecimento', r.taxaComparecimento === null ? 'sem visitas encerradas' : `${Math.round(r.taxaComparecimento * 100)}%`],
    ['Cancelamentos', String(r.cancelamentos)],
    ['Recusas', String(r.recusas)],
  ]

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Relatório de visitas"
        descricao="Visitas na agenda são as confirmadas e as já realizadas. Comparecimento compara as realizadas com as faltas."
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agenda de visitas' }}
      />

      <PeriodoRelatorio de={de} ate={ate} atalhos={atalhosDePeriodo(hoje)} />

      <section aria-label="Números do período" className="rounded-xl border border-tinta-900/15 bg-white p-4 sm:p-5">
        <p className="text-lg leading-relaxed text-tinta-900">
          De {formatarDiaCurto(de)} a {formatarDiaCurto(ate)}, o Memorial recebeu <strong className="tabular-nums">{r.pedidos} pedidos</strong>,
          teve <strong className="tabular-nums">{r.visitas} visitas</strong> na agenda e <strong className="tabular-nums">{r.visitantes} visitantes</strong>{' '}
          previstos.
        </p>
        <dl className="mt-4 grid border-t border-tinta-900/10 sm:grid-cols-2 sm:gap-x-8">
          {detalhes.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-baseline justify-between gap-3 border-b border-tinta-900/10 py-2.5">
              <dt className="text-sm text-tinta-700">{rotulo}</dt>
              <dd className="text-base font-bold tabular-nums text-tinta-900">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <TabelaGrupos titulo="Por tipo de visitante" coluna="Tipo" grupos={r.porTipoVisitante} />
        <TabelaGrupos titulo="Por faixa etária" coluna="Faixa" grupos={r.porFaixaEtaria} />
        <TabelaGrupos titulo="Horários mais usados" coluna="Início" grupos={r.porHorario} />
      </div>
    </div>
  )
}
