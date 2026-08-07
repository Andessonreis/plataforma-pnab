'use client'

import { Button, Select, InlineFeedback } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { PNAB_DEFAULT_ATTACHMENT_TYPES } from '@/lib/constants/attachment-types'
import { useAnexoUpload } from './use-anexo-upload'
import { AnexoDropzone } from './anexo-dropzone'
import { AnexoSelectedFiles } from './anexo-selected-files'

type TipoAnexoEdital = import('@/lib/constants/attachment-types').TipoAnexo

// Tipos de anexo padrão (derivado da constante compartilhada)
const TIPOS_ANEXO_PADRAO: SelectOption[] = PNAB_DEFAULT_ATTACHMENT_TYPES.map((t) => ({
  value: t.tipo,
  label: t.label,
}))

export function AnexoUpload({
  onUpload,
  uploading,
  tiposAnexoEdital,
}: {
  onUpload: (file: File, tipo: string, titulo: string) => Promise<boolean>
  uploading: boolean
  tiposAnexoEdital?: TipoAnexoEdital[] | null
}) {
  const {
    tipo,
    setTipo,
    files,
    localError,
    localSuccess,
    progress,
    addFiles,
    removeFile,
    handleSubmit,
  } = useAnexoUpload({ onUpload })

  const tipoOptions: SelectOption[] = tiposAnexoEdital?.length
    ? tiposAnexoEdital.map((t) => ({ value: t.tipo, label: t.label }))
    : TIPOS_ANEXO_PADRAO

  return (
    <div className="space-y-4">
      {localError && <InlineFeedback type="error" message={localError} />}
      {localSuccess && <InlineFeedback type="success" message={localSuccess} />}

      <AnexoDropzone files={files} onFilesSelected={addFiles} />
      <AnexoSelectedFiles files={files} uploading={uploading} onRemove={removeFile} />

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
