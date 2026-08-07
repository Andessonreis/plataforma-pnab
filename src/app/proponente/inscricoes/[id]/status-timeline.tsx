import { Card, IconCheckSimple } from '@/components/ui'
import { inscricaoStatusLabel } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

interface Props {
  steps: InscricaoStatus[]
  currentIndex: number
  currentStatus: InscricaoStatus
}

/**
 * Painel de andamento — elemento dominante da página: etapa atual em
 * destaque (brand) seguida da régua de progresso. Em telas estreitas mostra
 * só a barra da etapa atual (a régua completa de 6 passos não cabe sem
 * scroll horizontal forçado); a partir de `sm` mostra a régua inteira.
 */
export function StatusTimeline({ steps, currentIndex, currentStatus }: Props) {
  const progressPct = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0
  const etapaAtual = Math.min(currentIndex + 1, steps.length)

  return (
    <Card id="tour-detalhe-timeline" padding="lg" className="mb-6 border-t-2 border-t-brand-600">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="text-sm text-slate-500">Andamento da inscrição</p>
          <p className="text-xl font-semibold text-brand-700 mt-0.5">
            {inscricaoStatusLabel[currentStatus]}
          </p>
        </div>
        <span className="text-xs text-slate-500">Etapa {etapaAtual} de {steps.length}</span>
      </div>

      {/* Mobile: barra de progresso da etapa atual */}
      <div className="sm:hidden">
        <div
          className="h-2 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          />
        </div>
      </div>

      {/* Desktop/tablet: régua completa */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2" role="list">
        {steps.map((status, i) => {
          const isPast = i <= currentIndex
          const isCurrent = status === currentStatus
          return (
            <div key={status} className="flex items-center" role="listitem" aria-current={isCurrent ? 'step' : undefined}>
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={[
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                    isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : isPast
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {isPast && !isCurrent ? <IconCheckSimple className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>
                  {inscricaoStatusLabel[status]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 ${i < currentIndex ? 'bg-brand-300' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
