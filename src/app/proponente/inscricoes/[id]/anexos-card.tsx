import { Badge, IconDocument } from '@/components/ui'
import type { AnexoItem } from './types'

interface Props {
  anexos: AnexoItem[]
}

export function AnexosCard({ anexos }: Props) {
  if (anexos.length === 0) return null

  return (
    <section id="tour-detalhe-anexos" className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Anexos</h2>
      <ul className="divide-y divide-slate-100" role="list">
        {anexos.map((anexo) => (
          <li key={anexo.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <IconDocument className="h-5 w-5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
              <p className="text-xs text-slate-500">{anexo.tipo}</p>
            </div>
            {anexo.valido !== null && (
              <Badge variant={anexo.valido ? 'success' : 'error'}>
                {anexo.valido ? 'Válido' : 'Inválido'}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
