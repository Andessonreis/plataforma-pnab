import Link from 'next/link'
import { Badge, IconEdit } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'

export interface DraftInscricao {
  id: string
  numero: string
  editalTitulo: string
  updatedAt: Date
}

interface DraftInscricoesCardProps {
  drafts: DraftInscricao[]
  totalDrafts: number
}

// Lista compacta de rascunhos — sem cartão próprio, pra ser empilhada dentro do
// painel lateral do dashboard (DashboardSidebar) junto de prazos e notificações.
export function DraftInscricoesCard({ drafts, totalDrafts }: DraftInscricoesCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="titulo text-lg text-tinta-950">Rascunhos pendentes</h3>
        {totalDrafts > 0 && <Badge variant="warning">{totalDrafts}</Badge>}
      </div>

      {drafts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nenhum rascunho pendente no momento.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/proponente/inscricoes/${draft.id}/editar`}
                className="flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 -mx-2.5 hover:bg-slate-50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-snug truncate">{draft.editalTitulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Editado em {formatDate(draft.updatedAt)}</p>
                </div>
                <IconEdit className="h-4 w-4 shrink-0 mt-0.5 text-slate-500 group-hover:text-brand-600 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalDrafts > 0 && (
        <Link
          href="/proponente/inscricoes"
          className="mt-3 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          Ver todos os rascunhos
        </Link>
      )}
    </div>
  )
}
