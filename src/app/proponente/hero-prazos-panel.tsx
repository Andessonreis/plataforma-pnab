import Link from 'next/link'
import { IconArrowRight, IconCalendar } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'
import { contagemRegressiva, type UpcomingDeadline } from './upcoming-deadlines-card'

interface HeroPrazosPanelProps {
  deadlines: UpcomingDeadline[]
}

/**
 * Painel de prazos dentro do hero — mesma posição/composição do painel de
 * editais na abertura pública (rótulo + título + lista de cards claros com
 * fio de acento, ao lado da chamada, não embaixo dela numa coluna separada).
 */
export function HeroPrazosPanel({ deadlines }: HeroPrazosPanelProps) {
  if (deadlines.length === 0) return null

  return (
    <div id="tour-prazos" className="mt-8 min-w-0 border-t border-papel-100/15 pt-8 lg:mt-0 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="rotulo text-xs leading-none text-accent-300">Fique de olho</p>
          <h2 className="titulo text-xl tracking-wide text-papel-50">Próximos prazos</h2>
        </div>
        <Link
          href="/proponente/inscricoes"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent-300 underline-offset-4 hover:underline sm:inline-flex"
        >
          Minhas inscrições
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {deadlines.map((deadline) => (
          <li key={`${deadline.editalId}-${deadline.label}`}>
            <Link
              href={`/editais/${deadline.slug}`}
              className="group block rounded-md border-l-4 border-l-accent-500 bg-papel-50 px-4 py-3.5 transition-colors hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              <div className="flex items-start gap-2.5">
                <IconCalendar className="mt-0.5 h-4 w-4 shrink-0 text-tinta-400" />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-tinta-900 group-hover:text-brand-700">
                    {deadline.label}
                  </p>
                  <p className="truncate text-sm text-tinta-600">{deadline.editalTitulo}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-700">
                    {contagemRegressiva(deadline.dataHora)} · {formatDate(deadline.dataHora)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
