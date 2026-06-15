import Link from 'next/link'
import {
  IconCheckSimple,
  IconClock,
  IconDownload,
  IconArrowRight,
} from '@client/components/ui/icons'
import { formatDateTime } from '@shared/utils/format'
import { getCronogramaItemStatus } from '@shared/utils/cronograma'
import { isAcaoPublicacao } from '@shared/types/cronograma'
import type { CronogramaDisplayItem } from '@shared/types/cronograma'

interface CronogramaTimelineProps {
  cronograma: CronogramaDisplayItem[]
  slug: string
  now: Date
}

export function CronogramaTimeline({ cronograma, slug, now }: CronogramaTimelineProps) {
  return (
    <div className="relative">
      <div
        className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"
        aria-hidden="true"
      />

      <ol className="space-y-1">
        {cronograma.map((item, index) => {
          const status = getCronogramaItemStatus(cronograma, index, now)
          const isPast = status === 'past'
          const isCurrent = status === 'current'

          return (
            <li key={index} className="relative pl-10">
              <div
                className={[
                  'absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 z-10',
                  isPast
                    ? 'bg-brand-200 border-brand-300'
                    : isCurrent
                      ? 'bg-accent-400 border-accent-500 animate-pulse'
                      : 'bg-white border-brand-400',
                ].join(' ')}
                aria-hidden="true"
              />

              <div
                className={[
                  'rounded-lg p-3 transition-colors',
                  isPast
                    ? 'opacity-60'
                    : isCurrent
                      ? 'bg-accent-50 border border-accent-200'
                      : 'hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                  <span
                    className={[
                      'font-medium min-w-0 flex-1',
                      isPast ? 'text-slate-500' : 'text-slate-900',
                      isCurrent ? 'font-semibold' : '',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                  {item.fimEm ? (
                    <span
                      className={[
                        'text-sm font-medium tabular-nums shrink-0 whitespace-nowrap sm:text-right',
                        isPast
                          ? 'text-slate-400'
                          : isCurrent
                            ? 'text-accent-700'
                            : 'text-brand-700',
                      ].join(' ')}
                    >
                      <time dateTime={item.dataHora}>{formatDateTime(item.dataHora)}</time>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <time dateTime={item.fimEm}>{formatDateTime(item.fimEm)}</time>
                    </span>
                  ) : (
                    <time
                      dateTime={item.dataHora}
                      className={[
                        'text-sm font-medium tabular-nums shrink-0 whitespace-nowrap sm:text-right',
                        isPast
                          ? 'text-slate-400'
                          : isCurrent
                            ? 'text-accent-700'
                            : 'text-brand-700',
                      ].join(' ')}
                    >
                      {formatDateTime(item.dataHora)}
                    </time>
                  )}
                </div>
                {isPast && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <IconCheckSimple className="h-3 w-3" />
                    Concluído
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs text-accent-600 mt-1 font-medium">
                    <IconClock className="h-3 w-3" />
                    Em andamento
                  </span>
                )}

                {/* Links de ação quando publicação ou resultado disponível */}
                {(isPast || isCurrent) && isAcaoPublicacao(item.acao) && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <Link
                      href={`/editais/${slug}/publicacoes/${item.acao}`}
                      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Ver lista
                      <IconArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                    <a
                      href={`/api/editais/${slug}/publicacoes/${item.acao}?format=csv`}
                      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      <IconDownload className="h-3 w-3" aria-hidden="true" />
                      Baixar CSV
                    </a>
                  </div>
                )}
                {(isPast || isCurrent)
                  && (item.fase === 'RESULTADO_PRELIMINAR' || item.fase === 'RESULTADO_FINAL') && (
                  <div className="mt-2 text-xs">
                    <Link
                      href={`/editais/${slug}/resultados`}
                      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Ver resultados
                      <IconArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
