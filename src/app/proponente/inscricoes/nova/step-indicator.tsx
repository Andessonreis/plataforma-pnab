'use client'

// Os dois usos de rounded-full abaixo são o chip da etapa e o círculo numerado
// dentro dele — exceção explícita do guia de estilo (rounded-full só para
// badge/avatar/dot), não pílula decorativa.
// deslop-ignore-file 19
import { useEffect, useRef } from 'react'
import { IconArrowRight, IconCheck } from '@/components/ui/icons'
import type { Step } from './types'

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick: (index: number) => void
}

function labelDaEtapa(s: Step): string {
  return s.kind === 'categoria' ? 'Categoria' :
    s.kind === 'dados' ? 'Dados do Projeto' :
    s.kind === 'video' ? 'Vídeo' :
    s.kind === 'etapa_custom' ? s.etapa.titulo :
    s.kind === 'anexos' ? 'Anexos' :
    'Revisão'
}

function chaveDaEtapa(s: Step): string {
  return s.kind === 'etapa_custom' ? `custom:${s.etapa.id}` : s.kind
}

// Indicador de progresso das etapas da inscrição — permite voltar para etapas já concluídas.
export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const progressPct = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0
  const pillAtivaRef = useRef<HTMLLIElement>(null)

  // Rola a fileira mobile pra manter a etapa ativa visível — sem isso, num
  // edital com muitas etapas customizadas ela pode sair da tela conforme avança.
  useEffect(() => {
    pillAtivaRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentStep])

  return (
    <nav id="tour-nova-progresso" aria-label="Progresso da inscrição">
      {/* Mobile: resumo textual + barra, e logo abaixo a fileira de abas de
          verdade (com nome de cada etapa) rolável na horizontal — só números
          sem legenda não dizia nada, e esconder as abas por completo tirava a
          navegação por toque que o desktop tem. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-brand-700">{labelDaEtapa(steps[currentStep])}</p>
          <span className="text-xs text-slate-500">Etapa {currentStep + 1} de {steps.length}</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progressPct, 4)}%` }}
          />
        </div>

        <div className="relative mt-3 -mx-4">
          <ol className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-1">
            {steps.map((s, i) => {
              const isActive = i === currentStep
              const isCompleted = i < currentStep
              return (
                <li key={chaveDaEtapa(s)} ref={isActive ? pillAtivaRef : undefined} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => i < currentStep && onStepClick(i)}
                    disabled={i > currentStep}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors duration-300
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2
                      disabled:cursor-not-allowed
                      ${isActive ? 'bg-brand-600 text-white' : ''}
                      ${isCompleted ? 'bg-brand-100 text-brand-700 active:bg-brand-200' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-100 text-slate-500' : ''}
                    `}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                      ${isActive ? 'bg-white text-brand-600' : ''}
                      ${isCompleted ? 'bg-brand-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                    `}>
                      {isCompleted ? <IconCheck className="h-3 w-3" /> : i + 1}
                    </span>
                    {labelDaEtapa(s)}
                  </button>
                </li>
              )
            })}
          </ol>
          {/* Fade indicando que dá pra rolar — sem isso a fileira parece terminar na borda da tela. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-papel-50 to-transparent" aria-hidden="true" />
        </div>
      </div>

      {/* sm+: fileira de etapas clicáveis, com espaço de sobra pro rótulo de cada uma. */}
      <ol className="hidden sm:flex items-center gap-2">
        {steps.map((s, i) => {
          const label = labelDaEtapa(s)
          const isActive = i === currentStep
          const isCompleted = i < currentStep

          // A "borda de avanço" é o trecho entre o último chip concluído e o
          // ativo — é o único que ganha a seta pulsando, pra não virar ruído
          // repetido em toda a fileira.
          const isBordaDeAvanco = i === currentStep

          return (
            <li key={chaveDaEtapa(s)} className="flex items-center gap-2">
              {i > 0 && (
                <div className="flex items-center">
                  <div className={`h-px w-6 sm:w-10 transition-colors duration-300 ${i <= currentStep ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  {isBordaDeAvanco && (
                    <IconArrowRight
                      aria-hidden="true"
                      className="-ml-1 h-3.5 w-3.5 shrink-0 animate-pulse text-brand-500"
                    />
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => i < currentStep && onStepClick(i)}
                disabled={i > currentStep}
                aria-current={isActive ? 'step' : undefined}
                className={`flex min-h-[44px] items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-300
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2
                  disabled:cursor-not-allowed
                  ${isActive ? 'bg-brand-600 text-white' : ''}
                  ${isCompleted ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-100 text-slate-500' : ''}
                `}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300
                  ${isActive ? 'bg-white text-brand-600 scale-110' : ''}
                  ${isCompleted ? 'bg-brand-600 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                `}>
                  {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
