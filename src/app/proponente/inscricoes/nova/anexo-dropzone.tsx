'use client'

import { useState } from 'react'
import { IconDocument } from '@/components/ui/icons'
import { MAX_FILE_SIZE_MB, MIME_LABEL } from '@/lib/upload/anexo-config'

interface AnexoDropzoneProps {
  files: File[]
  onFilesSelected: (files: FileList | File[]) => void
}

// Área de arraste/seleção de arquivos para upload de anexos.
export function AnexoDropzone({ files, onFilesSelected }: AnexoDropzoneProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFilesSelected(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2
        ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}
      `}
    >
      <IconDocument className="h-8 w-8 text-slate-500 mx-auto mb-2" />
      <p className="text-sm text-slate-600">
        {files.length > 0 ? (
          <span className="font-medium text-brand-700">
            {files.length === 1 ? files[0].name : `${files.length} arquivos selecionados`}
          </span>
        ) : (
          <>Arraste arquivos ou <span className="text-brand-600 font-medium">clique para selecionar</span></>
        )}
      </p>
      <p className="text-xs text-slate-500 mt-1">
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
  )
}
