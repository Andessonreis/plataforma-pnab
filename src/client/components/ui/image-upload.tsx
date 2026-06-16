'use client'

import { useRef, useState } from 'react'
import { toast } from '@client/hooks/use-toast'
import { Button } from './button'

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export interface ImageUploadProps {
  label?: string
  hint?: string
  /** URL atual da imagem (vinda do banco) */
  value: string
  onChange: (url: string) => void
  /** Pasta dentro do bucket (controla onde a imagem é salva). */
  pasta?: 'noticias' | 'slides'
  /** Permite limpar/remover a imagem do formulário (não deleta do storage). */
  allowClear?: boolean
}

export function ImageUpload({
  label = 'Imagem',
  hint = 'Arraste uma imagem ou clique para selecionar. JPG, PNG ou WEBP, até 5 MB.',
  value,
  onChange,
  pasta = 'noticias',
  allowClear = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  function validateFile(file: File): string | null {
    if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) {
      return 'Tipo inválido. Use JPG, PNG ou WEBP.'
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1)
      return `Imagem muito grande (${mb} MB). Máximo 5 MB.`
    }
    return null
  }

  async function uploadFile(file: File) {
    const err = validateFile(file)
    if (err) {
      toast({ variant: 'destructive', title: 'Imagem inválida', description: err })
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('pasta', pasta)

      const res = await fetch('/api/v1/upload/imagem', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Falha no upload',
          description: json.message || 'Não foi possível enviar a imagem.',
        })
        return
      }

      onChange(json.data.url)
      toast({ title: 'Imagem enviada com sucesso' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
      })
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME.join(',')}
        onChange={handleFileChange}
        className="sr-only"
        aria-label={label}
      />

      {value ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pré-visualização da imagem"
            className="h-32 w-full rounded-md object-cover sm:w-48"
          />
          <div className="flex flex-1 flex-col gap-2">
            <p className="break-all text-xs text-slate-600">{value}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => inputRef.current?.click()}
              >
                Trocar imagem
              </Button>
              {allowClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => onChange('')}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          role="button"
          tabIndex={0}
          aria-busy={uploading}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2
            ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <p className="text-sm font-medium text-slate-700">
            {uploading ? 'Enviando imagem…' : 'Arraste uma imagem aqui ou clique para selecionar'}
          </p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
      )}
    </div>
  )
}
