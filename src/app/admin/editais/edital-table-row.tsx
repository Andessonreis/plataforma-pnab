import Link from 'next/link'
import { Badge } from '@/components/ui'
import { editalStatusLabel, editalStatusVariant } from '@/lib/status-maps'
import { formatCurrency } from '@/lib/utils/format'
import { EditalActions } from './edital-actions'
import type { EditalListItem } from './edital-mobile-card'

interface EditalTableRowProps {
  edital: EditalListItem
}

function EditalTableRow({ edital }: EditalTableRowProps) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors align-top">
      <td className="py-3 px-4 align-top">
        <Link href={`/admin/editais/${edital.id}`} className="block max-w-md group">
          <p className="font-medium text-slate-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
            {edital.titulo}
          </p>
          <p className="text-xs text-slate-500 font-mono truncate">{edital.slug}</p>
        </Link>
      </td>
      <td className="py-3 px-4 text-slate-600">{edital.ano}</td>
      <td className="py-3 px-4 overflow-hidden">
        <Badge variant={editalStatusVariant[edital.status]} className="max-w-full truncate">
          {editalStatusLabel[edital.status]}
        </Badge>
      </td>
      <td className="py-3 px-4 overflow-hidden">
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {edital.categorias.slice(0, 2).map((cat) => (
            <Badge key={cat} variant="neutral" className="max-w-full truncate">{cat}</Badge>
          ))}
          {edital.categorias.length > 2 && (
            <Badge variant="neutral">+{edital.categorias.length - 2}</Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-right font-mono text-slate-600">
        {formatCurrency(edital.valorTotal)}
      </td>
      <td className="py-3 px-4 text-center">
        <Link
          href={`/admin/inscricoes?editalId=${edital.id}`}
          className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
          title="Ver inscritos deste edital"
        >
          {edital._count.inscricoes}
        </Link>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end">
          <EditalActions
            editalId={edital.id}
            editalSlug={edital.slug}
            editalTitulo={edital.titulo}
            editalStatus={edital.status}
            inscricoesCount={edital._count.inscricoes}
            showInscritos={false}
            compact
          />
        </div>
      </td>
    </tr>
  )
}

export { EditalTableRow }
