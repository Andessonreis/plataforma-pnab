import type { EditalStatus } from '@prisma/client'
import { editalStatusLabel } from '@/lib/status-maps'
import { IconCheck } from '@/components/ui'

const ORDEM_FASES = Object.keys(editalStatusLabel) as EditalStatus[]

/** Trilha visual das 10 fases do edital, com a fase atual destacada. */
export function EditalFaseStepper({ statusAtual }: { statusAtual: EditalStatus }) {
  const indiceAtual = ORDEM_FASES.indexOf(statusAtual)

  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <ol className="flex items-start min-w-max sm:min-w-0 sm:w-full">
        {ORDEM_FASES.map((fase, i) => {
          const isPast = i < indiceAtual
          const isCurrent = i === indiceAtual
          const isLast = i === ORDEM_FASES.length - 1

          return (
            <li key={fase} className="flex-1 flex flex-col items-center min-w-[92px] sm:min-w-0">
              <div className="flex items-center w-full">
                <div
                  className={[
                    'h-0.5 flex-1',
                    i === 0 ? 'invisible' : isPast || isCurrent ? 'bg-brand-500' : 'bg-slate-200',
                  ].join(' ')}
                />
                <div
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    isCurrent
                      ? 'border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100'
                      : isPast
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400',
                  ].join(' ')}
                >
                  {isPast ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div
                  className={[
                    'h-0.5 flex-1',
                    isLast ? 'invisible' : isPast ? 'bg-brand-500' : 'bg-slate-200',
                  ].join(' ')}
                />
              </div>
              <p
                className={[
                  'mt-1.5 text-center text-[11px] leading-tight px-1',
                  isCurrent ? 'font-semibold text-brand-700' : isPast ? 'text-slate-600' : 'text-slate-400',
                ].join(' ')}
              >
                {editalStatusLabel[fase]}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
