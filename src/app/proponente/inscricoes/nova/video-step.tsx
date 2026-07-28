'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { IconCheck } from '@/components/ui/icons'
import { VIDEO_ANEXO_TIPOS, MAX_VIDEO_SIZE_MB } from '@/lib/upload/anexo-config'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { Anexo } from '@/types/anexo'
import { VideoAttach } from './video-attach'

type Escolha = 'manual' | 'video'

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
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Como você quer enviar sua proposta?</h2>
      <p className="text-sm text-slate-500 mb-6">
        Este edital aceita a inscrição em vídeo como alternativa ao preenchimento manual. Escolha uma das opções abaixo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setEscolha('manual')}
          className={`text-left rounded-lg border-2 p-4 transition-colors ${
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
          type="button"
          onClick={() => setEscolha('video')}
          className={`text-left rounded-lg border-2 p-4 transition-colors ${
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

      {escolha === 'video' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-800 mb-2">Como gravar o vídeo</p>
            <p className="mb-2">
              No vídeo, apresente-se e fale sobre o seu projeto cobrindo os mesmos pontos que seriam preenchidos
              {titulosEtapas.length > 0 ? ' nestas etapas:' : ' no formulário.'}
            </p>
            {titulosEtapas.length > 0 && (
              <ul className="list-disc list-inside space-y-1 mb-2">
                {etapasCustomizadas.map((etapa) => (
                  <li key={etapa.id}>
                    <span className="font-medium">{etapa.titulo}</span>
                    {etapa.descricao && <span className="text-slate-600"> — {etapa.descricao}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-slate-600">
              Grave em local com boa iluminação e áudio claro, fale de forma objetiva e evite ultrapassar {MAX_VIDEO_SIZE_MB}MB
              de arquivo (equivalente a poucos minutos de vídeo em boa qualidade). Você pode enviar o arquivo
              diretamente ou colar o link de um vídeo já hospedado (Google Drive, YouTube etc.).
            </p>
          </div>

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
