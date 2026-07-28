'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { IconDocument } from '@/components/ui/icons'
import {
  validateVideoFile,
  describeVideoValidationError,
  MAX_VIDEO_SIZE_MB,
  VIDEO_MIME_LABEL,
} from '@/lib/upload/anexo-config'
import type { Anexo } from '@/types/anexo'

type Modo = 'arquivo' | 'link'

interface VideoAttachProps {
  tipo: string
  tituloPadrao: string
  attached: Anexo | null
  uploading: boolean
  onUploadFile: (file: File, tipo: string, titulo: string) => Promise<boolean>
  onAttachLink: (url: string, tipo: string, titulo: string) => Promise<boolean>
  onRemove: (anexoId: string) => void
}

export function VideoAttach({
  tipo,
  tituloPadrao,
  attached,
  uploading,
  onUploadFile,
  onAttachLink,
  onRemove,
}: VideoAttachProps) {
  const [modo, setModo] = useState<Modo>('arquivo')
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState('')
  const [localError, setLocalError] = useState('')

  if (attached) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconDocument className="h-5 w-5 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{attached.titulo}</p>
            <p className="text-xs text-slate-500 truncate">{attached.url}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(attached.id)}
          className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 ml-3 min-h-[44px] px-2"
          aria-label={`Remover ${attached.titulo}`}
        >
          Remover
        </button>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!f) return
    const err = validateVideoFile(f)
    if (err) {
      setLocalError(describeVideoValidationError(err))
      return
    }
    setLocalError('')
    setFile(f)
  }

  const handleEnviar = async () => {
    setLocalError('')
    if (modo === 'arquivo') {
      if (!file) return
      const ok = await onUploadFile(file, tipo, tituloPadrao)
      if (ok) setFile(null)
      else setLocalError('Falha no envio do vídeo. Tente novamente.')
      return
    }

    if (!/^https:\/\/.+/i.test(link)) {
      setLocalError('Informe um link de vídeo válido (começando com https://).')
      return
    }
    const ok = await onAttachLink(link, tipo, tituloPadrao)
    if (ok) setLink('')
    else setLocalError('Falha ao anexar o link. Verifique o endereço e tente novamente.')
  }

  return (
    <div className="space-y-3">
      {localError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
          {localError}
        </div>
      )}

      <div className="flex gap-2" role="tablist" aria-label="Como enviar o vídeo">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'arquivo'}
          onClick={() => setModo('arquivo')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium min-h-[44px] transition-colors ${
            modo === 'arquivo' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Enviar arquivo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'link'}
          onClick={() => setModo('link')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium min-h-[44px] transition-colors ${
            modo === 'link' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Colar link do vídeo
        </button>
      </div>

      {modo === 'arquivo' ? (
        <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <IconDocument className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">
            {file ? (
              <span className="font-medium text-brand-700">{file.name}</span>
            ) : (
              <>Clique para selecionar o vídeo</>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {VIDEO_MIME_LABEL} — máx. {MAX_VIDEO_SIZE_MB}MB.
          </p>
          <input
            type="file"
            accept=".mp4,.webm,.mov"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Selecionar arquivo de vídeo"
          />
        </div>
      ) : (
        <Input
          label="Link do vídeo"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/... ou https://youtube.com/..."
          hint="Cole o link de compartilhamento do Google Drive, YouTube ou outro serviço de vídeo. O link precisa estar acessível para visualização."
        />
      )}

      <Button
        onClick={handleEnviar}
        disabled={modo === 'arquivo' ? !file : !link}
        loading={uploading}
        variant="secondary"
        type="button"
      >
        {modo === 'arquivo' ? 'Enviar vídeo' : 'Anexar link'}
      </Button>
    </div>
  )
}
