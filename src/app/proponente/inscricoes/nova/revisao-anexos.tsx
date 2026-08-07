'use client'

import { Badge } from '@/components/ui'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { Anexo } from '@/types/anexo'

interface RevisaoAnexosProps {
  anexos: Anexo[]
  tiposAnexoEdital?: TipoAnexo[] | null
}

// Resumo de anexos enviados na etapa de revisão, com alerta de obrigatórios faltantes.
export function RevisaoAnexos({ anexos, tiposAnexoEdital }: RevisaoAnexosProps) {
  const obrigatorios = tiposAnexoEdital?.filter((t) => t.obrigatorio) ?? []
  const faltantes = obrigatorios.filter((t) => !anexos.some((a) => a.tipo === t.tipo))

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">
        Anexos ({anexos.length})
      </h3>
      {anexos.length === 0 ? (
        <p className="text-sm text-red-700 italic">Nenhum anexo enviado</p>
      ) : (
        <ul className="space-y-2">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
              <Badge variant="neutral">{a.tipo}</Badge>
              {a.titulo}
            </li>
          ))}
        </ul>
      )}
      {faltantes.length > 0 && (
        <div className="mt-3 rounded-lg bg-accent-50 border border-accent-200 p-3 text-sm text-accent-800" role="alert">
          <strong>Anexos obrigatórios faltantes:</strong>{' '}
          {faltantes.map((f) => f.label).join(', ')}
        </div>
      )}
    </div>
  )
}
