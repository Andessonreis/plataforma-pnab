'use client'

import { useState } from 'react'
import { Button, Select } from '@client/components/ui'
import type { SelectOption } from '@client/components/ui'
import { IconDocument } from '@client/components/ui/icons'
import { PNAB_DEFAULT_ATTACHMENT_TYPES } from '@/lib/constants/attachment-types'
import {
  validateAnexoFile,
  describeValidationError,
  MAX_FILE_SIZE_MB,
  MIME_LABEL,
} from '@shared/upload/anexo-config'
import type { TipoAnexoEdital } from './types'

// Tipos de anexo padrão (derivado da constante compartilhada)
const TIPOS_ANEXO_PADRAO: SelectOption[] = PNAB_DEFAULT_ATTACHMENT_TYPES.map(t => ({
  value: t.tipo,
  label: t.label,
}))

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AnexoUpload({
  onUpload,
  uploading,
  tiposAnexoEdital,
}: {
  onUpload: (file: File, tipo: string, titulo: string) => Promise<boolean>
  uploading: boolean
  tiposAnexoEdital?: TipoAnexoEdital[] | null
}) {
  const [tipo, setTipo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState('')
  const [localSuccess, setLocalSuccess] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const tipoOptions: SelectOption[] = tiposAnexoEdital?.length
    ? tiposAnexoEdital.map(t => ({ value: t.tipo, label: t.label }))
    : TIPOS_ANEXO_PADRAO

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list)
    if (arr.length === 0) return
    setLocalSuccess('')

    // #78 — validação client-side imediata: tamanho + tipo, antes do upload
    const aceitos: File[] = []
    const rejeitados: string[] = []
    for (const f of arr) {
      const err = validateAnexoFile(f)
      if (err) {
        rejeitados.push(describeValidationError(err))
      } else {
        aceitos.push(f)
      }
    }

    if (rejeitados.length > 0) {
      setLocalError(rejeitados.join(' '))
    } else {
      setLocalError('')
    }

    if (aceitos.length > 0) {
      setFiles((prev) => [...prev, ...aceitos])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (files.length === 0 || !tipo) return
    setLocalError('')
    setLocalSuccess('')

    let enviados = 0
    const falhas: string[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length })
      const f = files[i]
      const titulo = f.name.replace(/\.[^.]+$/, '')
      const ok = await onUpload(f, tipo, titulo)
      if (ok) enviados++
      else falhas.push(f.name)
    }
    setProgress(null)

    if (falhas.length === 0) {
      setLocalSuccess(
        enviados === 1
          ? 'Arquivo enviado com sucesso!'
          : `${enviados} arquivos enviados com sucesso!`,
      )
      setTimeout(() => setLocalSuccess(''), 4000)
      setFiles([])
      setTipo('')
    } else {
      setLocalError(
        `Falha no envio de ${falhas.length} arquivo(s): ${falhas.join(', ')}. Verifique os arquivos e tente novamente.`,
      )
      // mantém os arquivos falhos pra o usuário reenviar
      setFiles((prev) => prev.filter((f) => falhas.includes(f.name)))
    }
  }

  return (
    <div className="space-y-4">
      {localError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
          {localError}
        </div>
      )}
      {localSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700" role="status">
          {localSuccess}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}
        `}
      >
        <IconDocument className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">
          {files.length > 0 ? (
            <span className="font-medium text-brand-700">
              {files.length === 1 ? files[0].name : `${files.length} arquivos selecionados`}
            </span>
          ) : (
            <>Arraste arquivos ou <span className="text-brand-600 font-medium">clique para selecionar</span></>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {MIME_LABEL} — máx. {MAX_FILE_SIZE_MB}MB cada. Você pode selecionar vários arquivos de uma vez.
        </p>
        <input
          id="anexo-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Selecionar arquivos para upload"
        />
      </div>

      {/* Lista de arquivos selecionados (ainda não enviados) */}
      {files.length > 0 && (
        <ul className="space-y-2" role="list" aria-label="Arquivos selecionados">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <IconDocument className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate text-slate-800">{f.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                disabled={uploading}
                className="text-slate-400 hover:text-red-600 text-xs font-medium px-2 disabled:opacity-50"
                aria-label={`Remover ${f.name} da seleção`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Tipo (aplicado a todos os arquivos) */}
      <Select
        label="Tipo do documento"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={tipoOptions}
        placeholder="Selecione o tipo..."
        required
        hint="O tipo será aplicado a todos os arquivos selecionados. Para tipos diferentes, envie em lotes separados."
      />

      <Button
        onClick={handleSubmit}
        disabled={files.length === 0 || !tipo}
        loading={uploading}
        variant="secondary"
        type="button"
      >
        {progress
          ? `Enviando ${progress.current}/${progress.total}...`
          : files.length > 1
            ? `Enviar ${files.length} arquivos`
            : 'Enviar Anexo'}
      </Button>
    </div>
  )
}
