'use client'

import { Badge, EmptyState, IconDocument, IconPdf } from '@/components/ui'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'
import type { Arquivo, TipoOption } from './edital-arquivos-types'
import { getTipoLabel } from './edital-arquivos-utils'
import { EditalArquivoRemoveButton } from './edital-arquivo-remove-button'

interface EditalArquivosListaProps {
  loading: boolean
  arquivos: Arquivo[]
  tipoOptions: TipoOption[]
  hasPending: boolean
  onDelete: (id: string) => void
}

/** Lista de arquivos já salvos no edital (modo edição), com ações de abrir e remover. */
export function EditalArquivosLista({
  loading,
  arquivos,
  tipoOptions,
  hasPending,
  onDelete,
}: EditalArquivosListaProps) {
  if (loading) {
    return <p className="text-sm text-slate-500 text-center py-4">Carregando arquivos...</p>
  }

  const hasItems = arquivos.length > 0 || hasPending

  if (!hasItems) {
    return (
      <EmptyState
        icon={<IconDocument className="h-8 w-8" />}
        title="Nenhum documento anexado"
        description="Adicione PDFs, anexos e modelos usando o formulário acima."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {arquivos.map((arq) => (
        <li key={arq.id} className="flex items-start justify-between py-3 gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <IconPdf className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{arq.titulo}</p>
              <div className="mt-1.5">
                <Badge variant={getBadgeVariantForTipo(arq.tipo)}>
                  {getTipoLabel(tipoOptions, arq.tipo)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={arq.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Abrir
            </a>
            <EditalArquivoRemoveButton
              onClick={() => onDelete(arq.id)}
              ariaLabel={`Remover ${arq.titulo}`}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
