import type { InscricaoStatus } from '@prisma/client'
import { Card } from '@client/components/ui'
import { inscricaoStatusLabel } from '@/lib/status-maps'

interface StatusTimelineProps {
  statusTimeline: InscricaoStatus[]
  currentStatusIndex: number
  status: InscricaoStatus
}

export function StatusTimeline({ statusTimeline, currentStatusIndex, status }: StatusTimelineProps) {
  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Andamento</h2>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTimeline.map((s, i) => {
          const isPast = i <= currentStatusIndex
          const isCurrent = s === status
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={[
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                    isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : isPast
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-400',
                  ].join(' ')}
                >
                  {isPast && !isCurrent ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>
                  {inscricaoStatusLabel[s]}
                </span>
              </div>
              {i < statusTimeline.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${i < currentStatusIndex ? 'bg-brand-300' : 'bg-slate-200'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
