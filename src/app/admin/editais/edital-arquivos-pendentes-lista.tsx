'use client'

import { Badge } from '@/components/ui'
import { IconPdf } from '@/components/ui'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'
import type { PendingFile, TipoOption } from './edital-arquivos-types'
import { getTipoLabel } from './edital-arquivos-utils'
import { EditalArquivoRemoveButton } from './edital-arquivo-remove-button'

interface EditalArquivosPendentesListaProps {
  pending: PendingFile[]
  tipoOptions: TipoOption[]
  onRemove: (localId: string) => void
}

/** Lista de arquivos enfileirados localmente (modo criação), aguardando o edital ser salvo. */
export function EditalArquivosPendentesLista({
  pending,
  tipoOptions,
  onRemove,
}: EditalArquivosPendentesListaProps) {
  if (pending.length === 0) return null

  return (
    <ul className="divide-y divide-slate-100 mb-2">
      {pending.map((item) => (
        <li key={item.localId} className="flex items-start justify-between py-3 gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <IconPdf className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{item.titulo}</p>
              <p className="text-xs text-slate-400 truncate">{item.file.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant={getBadgeVariantForTipo(item.tipo)}>
                  {getTipoLabel(tipoOptions, item.tipo)}
                </Badge>
                <Badge variant="warning">Pendente</Badge>
              </div>
            </div>
          </div>
          <EditalArquivoRemoveButton
            onClick={() => onRemove(item.localId)}
            ariaLabel={`Remover ${item.titulo}`}
          />
        </li>
      ))}
    </ul>
  )
}
