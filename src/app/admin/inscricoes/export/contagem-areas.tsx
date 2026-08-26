import Link from 'next/link'
import { SEM_AREA, labelArea } from '@/lib/inscricoes/area-filter'
import type { AreaOption } from './filter-form'

interface ContagemAreasProps {
  areas: AreaOption[]
  /** Query string base (edital/status já aplicados) pra montar o link de cada área. */
  baseParams: string
  selectedArea?: string
}

/**
 * Distribuição das inscrições por área dentro do recorte atual.
 * Serve pra equipe enxergar onde a mobilização de agentes está fraca.
 */
export default function ContagemAreas({ areas, baseParams, selectedArea }: ContagemAreasProps) {
  if (areas.length === 0) return null

  const maior = Math.max(...areas.map((a) => a.total))

  function hrefPara(nome: string): string {
    const params = new URLSearchParams(baseParams)
    const valor = nome || SEM_AREA
    if (selectedArea === valor) params.delete('categoria')
    else params.set('categoria', valor)
    const qs = params.toString()
    return `/admin/inscricoes/export${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Inscrições por área ({areas.length})
      </p>

      <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
        {areas.map((a) => {
          const valor = a.nome || SEM_AREA
          const ativo = selectedArea === valor
          const largura = maior > 0 ? Math.round((a.total / maior) * 100) : 0

          return (
            <li key={valor}>
              <Link
                href={hrefPara(a.nome)}
                aria-current={ativo ? 'true' : undefined}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 min-h-[44px] transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600',
                  ativo ? 'bg-brand-50' : 'hover:bg-slate-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex-1 min-w-0 truncate text-sm',
                    a.nome ? 'text-slate-700' : 'italic text-slate-400',
                    ativo ? 'font-semibold text-brand-800' : '',
                  ].join(' ')}
                >
                  {labelArea(a.nome)}
                </span>

                <span className="hidden sm:block w-32 shrink-0" aria-hidden="true">
                  <span className="block h-1.5 rounded-full bg-slate-100">
                    <span
                      className={`block h-1.5 rounded-full ${ativo ? 'bg-brand-600' : 'bg-brand-300'}`}
                      style={{ width: `${largura}%` }}
                    />
                  </span>
                </span>

                <span className="w-10 shrink-0 text-right text-sm font-semibold text-slate-800 tabular-nums">
                  {a.total}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {selectedArea && (
        <p className="mt-2 text-xs text-slate-400">
          Filtrando por uma área — clique nela de novo para ver todas.
        </p>
      )}
    </div>
  )
}
