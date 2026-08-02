'use client'

import type { ChangeEvent, RefObject } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { IconPlus } from '@/components/ui'
import type { TipoOption } from './edital-arquivos-types'
import { stripExtension } from './edital-arquivos-utils'

interface EditalArquivosUploadFormProps {
  editalId?: string
  titulo: string
  onTituloChange: (value: string) => void
  tipo: string
  onTipoChange: (value: string) => void
  tipoOptions: TipoOption[]
  fileInputRef: RefObject<HTMLInputElement | null>
  uploading: boolean
  error: string | null
  showPendingHint: boolean
  onSubmit: () => void
}

/** Área de seleção do arquivo, título e tipo, com o botão de envio (ou enfileiramento). */
export function EditalArquivosUploadForm({
  editalId,
  titulo,
  onTituloChange,
  tipo,
  onTipoChange,
  tipoOptions,
  fileInputRef,
  uploading,
  error,
  showPendingHint,
  onSubmit,
}: EditalArquivosUploadFormProps) {
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && !titulo.trim()) {
      onTituloChange(stripExtension(file.name))
    }
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Título do documento"
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          placeholder="Ex: Edital completo"
        />
        <Select
          label="Tipo"
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          options={tipoOptions}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Arquivo
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx"
            className="block w-full min-h-[44px] text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer file:min-h-[44px]"
            onChange={handleFileChange}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          loading={uploading}
          className="whitespace-nowrap w-full sm:w-auto"
        >
          <IconPlus className="h-4 w-4 mr-1" />
          {editalId ? 'Enviar' : 'Adicionar'}
        </Button>
      </div>

      {showPendingHint && (
        <p className="text-xs text-slate-500">
          Os arquivos serão enviados automaticamente ao salvar o edital.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}
