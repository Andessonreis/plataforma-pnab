import Link from 'next/link'
import { diaDaSemana, diasEntre } from '@/lib/memorial/agendamento/datas'
import type { VisitaCartao } from './cartao-visita'
import { StatusVisita } from './status-visita'

interface GradeMesProps {
  de: string
  ate: string
  hoje: string
  porDia: Map<string, VisitaCartao[]>
  urlDoDia: (dia: string) => string
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Grade mensal do desktop: cada visita aparece pelo horário e pela instituição; o dia abre a agenda do dia. */
export function GradeMes({ de, ate, hoje, porDia, urlDoDia }: GradeMesProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
        {SEMANA.map((s) => (
          <span key={s} className="px-2 py-2">
            {s}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: diaDaSemana(de) }, (_, i) => (
          <span key={`vazio-${i}`} className="border-b border-r border-slate-100 bg-slate-50/60" />
        ))}
        {diasEntre(de, ate).map((dia) => {
          const visitas = porDia.get(dia) ?? []
          return (
            <div key={dia} className="min-h-[7.5rem] border-b border-r border-slate-100 p-1.5">
              <Link
                href={urlDoDia(dia)}
                className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-1 text-xs font-semibold hover:bg-slate-100 ${
                  dia === hoje ? 'bg-brand-600 text-white hover:bg-brand-700' : 'text-slate-700'
                }`}
                aria-label={`Ver o dia ${Number(dia.slice(8))}`}
              >
                {Number(dia.slice(8))}
              </Link>
              <ul className="mt-1 space-y-1">
                {visitas.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/memorial/agendamentos/${v.id}`}
                      className="block rounded-md border border-slate-200 px-1.5 py-1 text-[11px] leading-tight text-slate-800 hover:border-brand-300 hover:bg-slate-50"
                    >
                      <span className="font-semibold tabular-nums">{v.horaInicio}</span> {v.instituicao}
                      <span className="mt-0.5 block">
                        <StatusVisita status={v.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
