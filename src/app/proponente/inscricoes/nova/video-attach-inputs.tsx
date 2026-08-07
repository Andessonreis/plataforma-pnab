'use client'

import { Input } from '@/components/ui'
import { IconDocument } from '@/components/ui/icons'
import { MAX_VIDEO_SIZE_MB, VIDEO_MIME_LABEL } from '@/lib/upload/anexo-config'
import type { Modo } from './video-attach-tabs'

interface VideoAttachInputsProps {
  modo: Modo
  file: File | null
  link: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLinkChange: (link: string) => void
}

// Campo de entrada do vídeo conforme o modo escolhido: dropzone de arquivo ou input de link.
export function VideoAttachInputs({ modo, file, link, onFileChange, onLinkChange }: VideoAttachInputsProps) {
  if (modo === 'arquivo') {
    return (
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2">
        <IconDocument className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-600">
          {file ? (
            <span className="font-medium text-brand-700">{file.name}</span>
          ) : (
            <>Clique para selecionar o vídeo</>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {VIDEO_MIME_LABEL} — máx. {MAX_VIDEO_SIZE_MB}MB.
        </p>
        <input
          type="file"
          accept=".mp4,.webm,.mov"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Selecionar arquivo de vídeo"
        />
      </div>
    )
  }

  return (
    <Input
      label="Link do vídeo"
      type="url"
      value={link}
      onChange={(e) => onLinkChange(e.target.value)}
      placeholder="https://drive.google.com/... ou https://youtube.com/..."
      hint="Cole o link de compartilhamento do Google Drive, YouTube ou outro serviço de vídeo. O link precisa estar acessível para visualização."
    />
  )
}
