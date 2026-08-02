import Link from 'next/link'
import type { PreviewRow } from './types'
import type { Faixa } from './preview-faixa'
import { FaixaBadge } from './preview-faixa-badge'

interface Props {
  rows: PreviewRow[]
  mostraFaixa: boolean
  decimals: number
  mostraCategoria: boolean
  getFaixa: (r: PreviewRow, index: number) => Faixa
  getPos: (r: PreviewRow, index: number) => number
}

/** Tabela desktop (lg+) da prévia de ranking. */
export function PreviewTable({ rows, mostraFaixa, decimals, mostraCategoria, getFaixa, getPos }: Props) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
            {mostraCategoria && <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>}
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Avaliações</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota final (prévia)</th>
            {mostraFaixa && (
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Faixa simulada</th>
            )}
            <th className="text-right py-3 px-4 font-semibold text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, index) => {
            const pos = getPos(r, index)
            const pendentes = Math.max(0, r.atribuidos - r.finalizadas)
            const semAval = r.finalizadas === 0
            const f = getFaixa(r, index)
            return (
              <tr key={r.inscricaoId} className={`hover:bg-slate-50 transition-colors ${semAval ? 'opacity-70' : ''}`}>
                <td className="py-3 px-4 font-medium text-slate-900">
                  <span className="flex items-center gap-1.5">
                    {semAval ? '—' : pos}
                    {r.empatado && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Empate
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{r.proponenteNome}</p>
                  <p className="text-xs text-slate-400">{r.numero}</p>
                </td>
                {mostraCategoria && <td className="py-3 px-4 text-slate-700">{r.categoria ?? '—'}</td>}
                <td className="py-3 px-4">
                  <span className="text-slate-700">{r.finalizadas} finalizada{r.finalizadas === 1 ? '' : 's'}</span>
                  {pendentes > 0 && (
                    <span className="ml-1.5 text-xs font-medium text-amber-600">
                      +{pendentes} pendente{pendentes === 1 ? '' : 's'}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {semAval ? '—' : r.notaFinal.toFixed(decimals)}
                  </span>
                </td>
                {mostraFaixa && (
                  <td className="py-3 px-4">
                    <FaixaBadge faixa={f} />
                  </td>
                )}
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/inscricoes/${r.inscricaoId}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Detalhes
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
