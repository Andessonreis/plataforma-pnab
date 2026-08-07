'use client'

import { useState } from 'react'
import { Button, InlineFeedback } from '@/components/ui'
import { IconDocument } from '@/components/ui/icons'
import { validateVideoFile, describeVideoValidationError } from '@/lib/upload/anexo-config'
import type { Anexo } from '@/types/anexo'
import { VideoAttachTabs, type Modo } from './video-attach-tabs'
import { VideoAttachInputs } from './video-attach-inputs'

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
          <IconDocument className="h-5 w-5 text-slate-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{attached.titulo}</p>
            <p className="text-xs text-slate-500 truncate">{attached.url}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(attached.id)}
          className="inline-flex min-h-[44px] items-center text-red-600 hover:text-red-700 text-sm font-medium shrink-0 ml-3 px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
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
      {localError && <InlineFeedback type="error" message={localError} />}

      <VideoAttachTabs modo={modo} onChange={setModo} />
      <VideoAttachInputs modo={modo} file={file} link={link} onFileChange={handleFileChange} onLinkChange={setLink} />

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
