import { respostaRecursoLiberada } from '@/lib/edital/fase'
import type { EditalStatus } from '@prisma/client'
import type { RecursoItem } from './types'
import { RecursoItemCard } from './recurso-item'

interface Props {
  recursos: RecursoItem[]
  inscricaoId: string
  editalStatus: EditalStatus
}

/** Seção da coluna lateral — sem Card próprio, compõe o painel único de status/metadados. */
export function RecursosCard({ recursos, inscricaoId, editalStatus }: Props) {
  if (recursos.length === 0) return null

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3">Recursos</h3>
      <ul className="divide-y divide-slate-100">
        {recursos.map((recurso) => (
          <li key={recurso.id} className="py-3 first:pt-0 last:pb-0">
            <RecursoItemCard
              recurso={recurso}
              inscricaoId={inscricaoId}
              liberada={respostaRecursoLiberada(recurso.fase, editalStatus)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
