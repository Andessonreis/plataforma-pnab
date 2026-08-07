'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { VIDEO_ANEXO_TIPOS } from '@/lib/upload/anexo-config'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { Anexo } from '@/types/anexo'
import { VideoAttach } from './video-attach'
import { VideoStepChoiceCards, type Escolha } from './video-step-choice-cards'
import { VideoStepInstructions } from './video-step-instructions'

interface VideoStepProps {
  etapasCustomizadas: EtapaCustomizada[]
  anexoVideo: Anexo | null
  uploading: boolean
  onUploadFile: (file: File, tipo: string, titulo: string) => Promise<boolean>
  onAttachLink: (url: string, tipo: string, titulo: string) => Promise<boolean>
  onRemove: (anexoId: string) => void
}

export function VideoStep({
  etapasCustomizadas,
  anexoVideo,
  uploading,
  onUploadFile,
  onAttachLink,
  onRemove,
}: VideoStepProps) {
  const [escolha, setEscolha] = useState<Escolha>(anexoVideo ? 'video' : 'manual')
  const titulosEtapas = etapasCustomizadas.map((e) => e.titulo)

  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Como você quer enviar sua proposta?</h2>
      <p className="text-sm text-slate-600 mb-6">
        Este edital aceita a inscrição em vídeo como alternativa ao preenchimento manual. Escolha uma das opções abaixo.
      </p>

      <VideoStepChoiceCards escolha={escolha} onChange={setEscolha} titulosEtapas={titulosEtapas} />

      {escolha === 'video' && (
        <div className="mt-6 space-y-4">
          <VideoStepInstructions etapasCustomizadas={etapasCustomizadas} />
          <VideoAttach
            tipo={VIDEO_ANEXO_TIPOS.substitutivo}
            tituloPadrao="Vídeo da inscrição"
            attached={anexoVideo}
            uploading={uploading}
            onUploadFile={onUploadFile}
            onAttachLink={onAttachLink}
            onRemove={onRemove}
          />
        </div>
      )}
    </Card>
  )
}
