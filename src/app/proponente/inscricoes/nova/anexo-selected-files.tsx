'use client'

import { IconDocument } from '@/components/ui/icons'

interface AnexoSelectedFilesProps {
  files: File[]
  uploading: boolean
  onRemove: (idx: number) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Lista de arquivos selecionados aguardando envio, com opção de remover antes do upload.
export function AnexoSelectedFiles({ files, uploading, onRemove }: AnexoSelectedFilesProps) {
  if (files.length === 0) return null

  return (
    <ul className="space-y-2" role="list" aria-label="Arquivos selecionados">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <IconDocument className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="truncate text-slate-900">{f.name}</span>
            <span className="text-xs text-slate-500 shrink-0">{formatSize(f.size)}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            disabled={uploading}
            className="inline-flex min-h-[44px] items-center text-slate-500 hover:text-red-700 text-xs font-medium px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50"
            aria-label={`Remover ${f.name} da seleção`}
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  )
}
