import { ValorRevisado } from '@/components/avaliacao/valor-revisado'
import { notaAnteriorDoCriterio } from '@/lib/avaliacao/revisao-recurso'
import type { AvaliacaoView, CriterioView } from './avaliacoes-comparativo'

export function fmtNota(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function notaChipClass(pct: number): string {
  if (pct >= 0.7) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (pct >= 0.5) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-red-50 text-red-700 ring-red-200'
}

export function FragmentBloco({
  bloco,
  items,
  avaliacoes,
  notaMaps,
  colSpan,
}: {
  bloco: string
  items: CriterioView[]
  avaliacoes: AvaliacaoView[]
  notaMaps: Map<string, number>[]
  colSpan: number
}) {
  return (
    <>
      {bloco && (
        <tr>
          <td
            colSpan={colSpan}
            className="sticky left-0 bg-slate-50/80 py-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100"
          >
            {bloco}
          </td>
        </tr>
      )}
      {items.map((c) => (
        <tr key={c.criterio} className="hover:bg-slate-50/50">
          <td className="sticky left-0 z-10 bg-white py-2.5 px-3 border-b border-slate-100">
            <span className="block text-sm font-medium text-slate-800 leading-snug">{c.criterio}</span>
            <span className="block text-[11px] text-slate-400">peso {c.peso}</span>
          </td>
          {avaliacoes.map((a, i) => {
            const nota = notaMaps[i].get(c.criterio)
            const max = c.notaMax || 10
            const anterior = notaAnteriorDoCriterio(a.revisao, c.criterio, nota)
            return (
              <td key={a.id} className="py-2.5 px-3 text-center border-b border-slate-100">
                {nota === undefined ? (
                  <span className="text-slate-300">—</span>
                ) : (
                  <span
                    className={[
                      'inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md text-sm font-semibold tabular-nums ring-1 ring-inset',
                      notaChipClass(nota / max),
                    ].join(' ')}
                  >
                    {anterior === null ? fmtNota(nota) : <ValorRevisado anterior={fmtNota(anterior)} atual={fmtNota(nota)} />}
                  </span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
