'use client'

import { forwardRef } from 'react'
import { Card } from '@/components/ui'
import { useEditalArquivos, type EditalArquivosHandle } from './use-edital-arquivos'
import { EditalArquivosUploadForm } from './edital-arquivos-upload-form'
import { EditalArquivosPendentesLista } from './edital-arquivos-pendentes-lista'
import { EditalArquivosLista } from './edital-arquivos-lista'

export type { EditalArquivosHandle } from './use-edital-arquivos'

interface EditalArquivosProps {
  editalId?: string
}

export const EditalArquivos = forwardRef<EditalArquivosHandle, EditalArquivosProps>(
  function EditalArquivos({ editalId }, ref) {
    const {
      arquivos,
      pending,
      uploading,
      loading,
      error,
      tipoOptions,
      tipo,
      setTipo,
      titulo,
      setTitulo,
      fileInputRef,
      handleUpload,
      handleDelete,
      handleRemovePending,
    } = useEditalArquivos(editalId, ref)

    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentos e Anexos</h2>

        <EditalArquivosUploadForm
          editalId={editalId}
          titulo={titulo}
          onTituloChange={setTitulo}
          tipo={tipo}
          onTipoChange={setTipo}
          tipoOptions={tipoOptions}
          fileInputRef={fileInputRef}
          uploading={uploading}
          error={error}
          showPendingHint={!editalId && pending.length > 0}
          onSubmit={handleUpload}
        />

        <EditalArquivosPendentesLista
          pending={pending}
          tipoOptions={tipoOptions}
          onRemove={handleRemovePending}
        />

        <EditalArquivosLista
          loading={loading}
          arquivos={arquivos}
          tipoOptions={tipoOptions}
          hasPending={pending.length > 0}
          onDelete={handleDelete}
        />
      </Card>
    )
  },
)
