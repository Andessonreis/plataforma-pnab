'use client'

import { Button } from '@/components/ui'
import { IconArrowLeft, IconArrowRight, IconCheck } from '@/components/ui/icons'
import type { Step } from './types'

interface FormNavigationProps {
  step: Step
  currentStep: number
  onPrev: () => void
  onNext: () => void
  onSaveRascunho: () => void
  onSubmit: () => void
  saving: boolean
  submitting: boolean
  podeAvancarDeAnexos: boolean
  anexosObrigatoriosFaltandoLabels: string[]
}

// Navegação inferior do wizard: voltar/salvar rascunho/próximo ou enviar, conforme a etapa atual.
export function FormNavigation({
  step,
  currentStep,
  onPrev,
  onNext,
  onSaveRascunho,
  onSubmit,
  saving,
  submitting,
  podeAvancarDeAnexos,
  anexosObrigatoriosFaltandoLabels,
}: FormNavigationProps) {
  const bloqueadoPorAnexos = step.kind === 'anexos' && !podeAvancarDeAnexos

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={onPrev} type="button" className="group">
            <IconArrowLeft className="h-4 w-4 mr-1 transition-transform duration-150 group-hover:-translate-x-0.5" />
            Voltar
          </Button>
        )}
        {(step.kind === 'dados' || step.kind === 'categoria' || step.kind === 'etapa_custom') && (
          <Button
            id="tour-nova-salvar-rascunho"
            variant="ghost"
            onClick={onSaveRascunho}
            loading={saving}
            type="button"
          >
            Salvar rascunho
          </Button>
        )}
      </div>

      <div id="tour-nova-navegacao" className="flex flex-col items-end gap-1">
        {step.kind !== 'revisao' ? (
          <>
            <Button
              onClick={onNext}
              type="button"
              disabled={bloqueadoPorAnexos}
              className="group"
              title={bloqueadoPorAnexos ? `Faltam anexos obrigatórios: ${anexosObrigatoriosFaltandoLabels.join(', ')}` : undefined}
            >
              Próximo
              <IconArrowRight className="h-4 w-4 ml-1 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Button>
            {bloqueadoPorAnexos && (
              <p className="text-xs text-accent-700" aria-live="polite">
                Envie os anexos obrigatórios para avançar
              </p>
            )}
          </>
        ) : (
          <Button onClick={onSubmit} loading={submitting} type="button" className="group">
            <IconCheck className="h-4 w-4 mr-1 transition-transform duration-150 group-hover:scale-110" />
            Enviar Inscrição
          </Button>
        )}
      </div>
    </div>
  )
}
