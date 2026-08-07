'use client'

import { IconCheck } from '@/components/ui/icons'

export type Escolha = 'manual' | 'video'

interface VideoStepChoiceCardsProps {
  escolha: Escolha
  onChange: (escolha: Escolha) => void
  titulosEtapas: string[]
}

// Escolha entre preencher o formulário manualmente ou substituir as etapas por um vídeo único.
export function VideoStepChoiceCards({ escolha, onChange, titulosEtapas }: VideoStepChoiceCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        id="tour-nova-video-manual"
        type="button"
        onClick={() => onChange('manual')}
        className={`text-left rounded-lg border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
          escolha === 'manual' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {escolha === 'manual' && <IconCheck className="h-4 w-4 text-brand-600" />}
          <span className="font-medium text-slate-900">Preencher manualmente</span>
        </div>
        <p className="text-sm text-slate-600">
          Você preenche normalmente as próximas etapas do formulário
          {titulosEtapas.length > 0 && <> ({titulosEtapas.join(', ')})</>}.
          Depois, na etapa de Anexos, você também pode anexar um vídeo complementar, se quiser — é opcional.
        </p>
      </button>

      <button
        id="tour-nova-video-video"
        type="button"
        onClick={() => onChange('video')}
        className={`text-left rounded-lg border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
          escolha === 'video' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {escolha === 'video' && <IconCheck className="h-4 w-4 text-brand-600" />}
          <span className="font-medium text-slate-900">Enviar por vídeo</span>
        </div>
        <p className="text-sm text-slate-600">
          Em vez de preencher os campos das próximas etapas, você grava um único vídeo respondendo o que
          essas etapas pedem. As etapas seguintes ficam dispensadas.
        </p>
      </button>
    </div>
  )
}
