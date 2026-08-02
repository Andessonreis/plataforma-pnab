import Link from 'next/link'
import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { PublishedRow } from './published-types'

interface Props {
  rows: PublishedRow[]
  mostraCategoria: boolean
}

/** Tabela desktop (lg+) do resultado oficial pós-publicação. */
export function PublishedDesktopTable({ rows, mostraCategoria }: Props) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
            {mostraCategoria && <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>}
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Avaliações</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota Final</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
            <th className="text-right py-3 px-4 font-semibold text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.inscricaoId} className={`hover:bg-slate-50 transition-colors ${row.isEmpatada ? 'bg-amber-50/50' : ''}`}>
              <td className="py-3 px-4 font-medium text-slate-900">
                <span className="flex items-center gap-1.5">
                  {row.posicaoExibida}
                  {row.isEmpatada && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Empate
                    </span>
                  )}
                </span>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-slate-900">{row.proponenteNome}</p>
                  <p className="text-xs text-slate-400">{row.numero}</p>
                </div>
              </td>
              {mostraCategoria && <td className="py-3 px-4 text-slate-700">{row.categoria ?? '—'}</td>}
              <td className="py-3 px-4 text-slate-700">{row.totalAvaliacoes}</td>
              <td className="py-3 px-4">
                <span className="font-semibold text-slate-900">{row.notaFinal != null ? row.notaFinal.toFixed(2) : '—'}</span>
              </td>
              <td className="py-3 px-4">
                <Badge variant={inscricaoStatusVariant[row.status]}>{inscricaoStatusLabel[row.status]}</Badge>
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/inscricoes/${row.inscricaoId}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
