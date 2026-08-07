'use client'

import { IconDocument } from '@/components/ui/icons'
import type { Anexo } from '@/types/anexo'

interface AnexosListaEnviadosProps {
  anexos: Anexo[]
  onRemove: (anexoId: string) => void
}

// Lista de anexos já enviados nesta inscrição, com opção de remover.
export function AnexosListaEnviados({ anexos, onRemove }: AnexosListaEnviadosProps) {
  if (anexos.length === 0) return null

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-base font-semibold text-slate-900">
        Anexos enviados ({anexos.length})
      </h3>
      {anexos.map((anexo) => (
        <div
          key={anexo.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <IconDocument className="h-5 w-5 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
              <p className="text-xs text-slate-500">{anexo.tipo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(anexo.id)}
            className="inline-flex min-h-[44px] items-center text-red-600 hover:text-red-700 text-sm font-medium shrink-0 ml-3 px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            aria-label={`Remover ${anexo.titulo}`}
          >
            Remover
          </button>
        </div>
      ))}
    </div>
  )
}
