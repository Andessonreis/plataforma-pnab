'use client'

import { Card } from '@/components/ui'
import { VIDEO_ANEXO_TIPOS } from '@/lib/upload/anexo-config'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { Anexo } from '@/types/anexo'
import { AnexoUpload } from './anexo-upload'
import { VideoAttach } from './video-attach'
import { AnexosArquivosEdital } from './anexos-arquivos-edital'
import { AnexosChecklist } from './anexos-checklist'
import { AnexosListaEnviados } from './anexos-lista-enviados'
import { DeclaracaoParceriaField } from './declaracao-parceria-field'
import type { DeclaracaoParceria } from '@/types/declaracao-parceria'

interface ArquivoEditalDownload {
  id: string
  tipo: string
  titulo: string
  url: string
  acessivel: boolean
}

interface StepAnexosProps {
  arquivosEdital?: ArquivoEditalDownload[]
  tipoLabels?: Record<string, string>
  tiposAnexo: TipoAnexo[]
  tiposAnexoEdital?: TipoAnexo[] | null
  anexos: Anexo[]
  uploading: boolean
  onUpload: (file: File, tipo: string, titulo: string) => Promise<boolean>
  videoHabilitado?: boolean
  submissaoPorVideo: boolean
  anexoVideoComplementar: Anexo | null
  onAttachVideoLink: (url: string, tipo: string, titulo: string) => Promise<boolean>
  onRemoveAnexo: (anexoId: string) => void
  mostrarDeclaracaoParceria?: boolean
  declaracaoParceria?: DeclaracaoParceria
  onDeclaracaoParceriaChange?: (value: DeclaracaoParceria) => void
}

export function StepAnexos({
  arquivosEdital,
  tipoLabels,
  tiposAnexo,
  tiposAnexoEdital,
  anexos,
  uploading,
  onUpload,
  videoHabilitado,
  submissaoPorVideo,
  anexoVideoComplementar,
  onAttachVideoLink,
  onRemoveAnexo,
  mostrarDeclaracaoParceria,
  declaracaoParceria,
  onDeclaracaoParceriaChange,
}: StepAnexosProps) {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Documentos e Anexos</h2>
      <p className="text-sm text-slate-600 mb-6">
        Envie os documentos necessários para sua inscrição. Formatos aceitos: PDF, PNG, JPEG (máx. 10MB cada).
        <span className="block mt-1">Você pode enviar <strong>mais de um arquivo</strong> por item se precisar.</span>
      </p>

      <AnexosArquivosEdital arquivos={arquivosEdital ?? []} tipoLabels={tipoLabels} />

      {mostrarDeclaracaoParceria && declaracaoParceria && onDeclaracaoParceriaChange && (
        <DeclaracaoParceriaField value={declaracaoParceria} onChange={onDeclaracaoParceriaChange} />
      )}

      <AnexosChecklist tipos={tiposAnexo} anexos={anexos} />

      <AnexoUpload onUpload={onUpload} uploading={uploading} tiposAnexoEdital={tiposAnexoEdital} />

      {videoHabilitado && !submissaoPorVideo && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Vídeo complementar (opcional)</h3>
          <p className="text-xs text-slate-500 mb-3">
            Se quiser, anexe um vídeo complementar à sua inscrição preenchida manualmente.
          </p>
          <VideoAttach
            tipo={VIDEO_ANEXO_TIPOS.complementar}
            tituloPadrao="Vídeo complementar"
            attached={anexoVideoComplementar}
            uploading={uploading}
            onUploadFile={onUpload}
            onAttachLink={onAttachVideoLink}
            onRemove={onRemoveAnexo}
          />
        </div>
      )}

      <AnexosListaEnviados anexos={anexos} onRemove={onRemoveAnexo} />
    </Card>
  )
}
