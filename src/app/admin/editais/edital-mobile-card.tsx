import Link from 'next/link'
import type { EditalStatus } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'
import { Badge } from '@/components/ui'
import { editalStatusLabel, editalStatusVariant } from '@/lib/status-maps'
import { formatCurrency } from '@/lib/utils/format'
import { EditalActions } from './edital-actions'

interface EditalListItem {
  id: string
  slug: string
  titulo: string
  ano: number
  status: EditalStatus
  categorias: string[]
  valorTotal: Decimal | null
  _count: { inscricoes: number }
}

interface EditalMobileCardProps {
  edital: EditalListItem
}

function EditalMobileCard({ edital }: EditalMobileCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <Link
        href={`/admin/editais/${edital.id}`}
        className="block hover:text-brand-700 transition-colors"
      >
        <p className="text-[13px] font-medium text-slate-900 leading-snug mb-2 line-clamp-2">{edital.titulo}</p>
      </Link>
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5 overflow-hidden">
        <Badge variant={editalStatusVariant[edital.status]}>
          {editalStatusLabel[edital.status]}
        </Badge>
        {edital.categorias.slice(0, 1).map((cat) => (
          <Badge key={cat} variant="neutral">{cat}</Badge>
        ))}
        {edital.categorias.length > 1 && (
          <Badge variant="neutral">+{edital.categorias.length - 1}</Badge>
        )}
      </div>
      <div className="text-[11px] text-slate-500 mb-2.5">
        {edital.ano} · <span className="font-mono">{formatCurrency(edital.valorTotal)}</span>
      </div>
      <div className="pt-2 border-t border-slate-100">
        <EditalActions
          editalId={edital.id}
          editalSlug={edital.slug}
          editalTitulo={edital.titulo}
          editalStatus={edital.status}
          inscricoesCount={edital._count.inscricoes}
        />
      </div>
    </div>
  )
}

export { EditalMobileCard }
export type { EditalListItem }
