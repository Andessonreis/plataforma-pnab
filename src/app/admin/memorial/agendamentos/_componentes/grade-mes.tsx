import Link from 'next/link'
import { diaDaSemana, diasEntre } from '@/lib/memorial/agendamento/datas'
import type { VisitaCartao } from '@/app/admin/memorial/_ui/agenda-visita'
import { BlocoVisita } from '@/app/admin/memorial/_ui/agenda-semana'

interface GradeMesProps {
  de: string
  ate: string
  hoje: string
  porDia: Map<string, VisitaCartao[]>
  urlDoDia: (dia: string) => string
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
/** Acima disso a célula mostra "+N" e o dia inteiro abre na agenda do dia. */
const MAX_NA_CELULA = 3

/** Grade mensal do desktop: cada visita é um bloco colorido pela situação, com horário e tamanho do grupo. */
export function GradeMes({ de, ate, hoje, porDia, urlDoDia }: GradeMesProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-tinta-900/15 bg-white lg:block">
      <div className="grid grid-cols-7 border-b border-tinta-900/10 bg-papel-50 text-xs font-bold text-tinta-700">
        {SEMANA.map((s) => (
          <span key={s} className="px-2 py-2">
            {s}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: diaDaSemana(de) }, (_, i) => (
          <span key={`vazio-${i}`} className="border-b border-r border-tinta-900/10 bg-papel-50/60" />
        ))}
        {diasEntre(de, ate).map((dia) => {
          const visitas = porDia.get(dia) ?? []
          const passou = dia < hoje
          const extras = visitas.length - MAX_NA_CELULA
          return (
            <div key={dia} className={`min-h-[8.5rem] border-b border-r border-tinta-900/10 p-1.5 ${passou ? 'bg-papel-50/50' : ''}`}>
              <Link
                href={urlDoDia(dia)}
                className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-1.5 text-sm font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-accent-500 ${
                  dia === hoje ? 'bg-brand-600 text-white hover:bg-brand-700' : passou ? 'text-tinta-500 hover:bg-papel-100' : 'text-tinta-900 hover:bg-papel-100'
                }`}
                aria-label={`Abrir o dia ${Number(dia.slice(8))}${visitas.length ? `, ${visitas.length} visitas` : ''}`}
              >
                {Number(dia.slice(8))}
              </Link>
              <ul className="mt-1 space-y-1">
                {visitas.slice(0, MAX_NA_CELULA).map((v) => (
                  <li key={v.id}>
                    <BlocoVisita visita={v} />
                  </li>
                ))}
              </ul>
              {extras > 0 && (
                <Link href={urlDoDia(dia)} className="mt-1 block text-xs font-bold text-brand-700 hover:underline">
                  mais {extras}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
