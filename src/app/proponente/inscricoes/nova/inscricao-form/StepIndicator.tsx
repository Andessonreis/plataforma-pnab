import { IconCheck } from '@client/components/ui/icons'
import type { Step } from './types'

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: Step[]
  currentStep: number
  onStepClick: (index: number) => void
}) {
  return (
    <nav aria-label="Progresso da inscrição">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const label =
            s.kind === 'categoria' ? 'Categoria' :
            s.kind === 'dados' ? 'Dados do Projeto' :
            s.kind === 'etapa_custom' ? s.etapa.titulo :
            s.kind === 'anexos' ? 'Anexos' :
            'Revisão'
          const key = s.kind === 'etapa_custom' ? `custom:${s.etapa.id}` : s.kind
          const isActive = i === currentStep
          const isCompleted = i < currentStep

          return (
            <li key={key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-6 sm:w-10 ${isCompleted ? 'bg-brand-500' : 'bg-slate-200'}`} />
              )}
              <button
                type="button"
                onClick={() => i < currentStep && onStepClick(i)}
                disabled={i > currentStep}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                  ${isActive ? 'bg-brand-600 text-white' : ''}
                  ${isCompleted ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-100 text-slate-400' : ''}
                `}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                  ${isActive ? 'bg-white text-brand-600' : ''}
                  ${isCompleted ? 'bg-brand-600 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                `}>
                  {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
