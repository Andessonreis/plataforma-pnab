import { Card } from '@/components/ui'

interface NotaItem {
  criterio: string
  nota: number
  peso: number
}

export interface AvaliacaoView {
  id: string
  nome: string
  finalizada: boolean
  notaTotal: number | null
  notas: NotaItem[]
  parecer: string | null
  data: string
}

export interface CriterioView {
  criterio: string
  peso: number
  notaMax: number
  descricao?: string
  bloco?: string
}

interface Props {
  criterios: CriterioView[]
  avaliacoes: AvaliacaoView[]
  hasFormula: boolean
}

function fmtNota(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function notaChipClass(pct: number): string {
  if (pct >= 0.7) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (pct >= 0.5) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-red-50 text-red-700 ring-red-200'
}

export function AvaliacoesComparativo({ criterios, avaliacoes, hasFormula }: Props) {
  const notaMaps = avaliacoes.map((a) => {
    const m = new Map<string, number>()
    for (const n of a.notas) m.set(n.criterio, n.nota)
    return m
  })

  const temBlocos = criterios.some((c) => c.bloco && c.bloco.trim() !== '')
  const grupos = temBlocos
    ? Array.from(
        criterios.reduce((map, c) => {
          const k = c.bloco?.trim() || 'Geral'
          if (!map.has(k)) map.set(k, [])
          map.get(k)!.push(c)
          return map
        }, new Map<string, CriterioView[]>()),
      )
    : [['', criterios] as [string, CriterioView[]]]

  const totais = avaliacoes
    .map((a) => a.notaTotal)
    .filter((n): n is number => n !== null)
  const media = totais.length > 0 ? totais.reduce((a, n) => a + n, 0) / totais.length : null
  const decimals = hasFormula ? 2 : 1

  const temNotas = criterios.length > 0 && avaliacoes.some((a) => a.notas.length > 0)

  return (
    <Card padding="sm" className="sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          Avaliações ({avaliacoes.length})
        </h2>
        {media !== null && (
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nota média</p>
            <p className="text-lg font-bold text-brand-700 tabular-nums leading-none">{media.toFixed(decimals)}</p>
          </div>
        )}
      </div>

      {temNotas && (
        <div className="overflow-x-auto -mx-3 sm:mx-0 mb-4">
          <table className="w-full min-w-[28rem] text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  Critério
                </th>
                {avaliacoes.map((a) => (
                  <th key={a.id} className="py-2.5 px-3 text-center border-b border-slate-200 min-w-[5.5rem]">
                    <span className="block text-xs font-semibold text-slate-700 leading-tight truncate max-w-[8rem] mx-auto">
                      {a.nome}
                    </span>
                    <span
                      className={[
                        'mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        a.finalizada ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                      ].join(' ')}
                    >
                      {a.finalizada ? 'Finalizada' : 'Pendente'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.map(([bloco, items]) => (
                <FragmentBloco
                  key={bloco || 'geral'}
                  bloco={bloco}
                  items={items}
                  avaliacoes={avaliacoes}
                  notaMaps={notaMaps}
                  colSpan={avaliacoes.length + 1}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sticky left-0 z-10 bg-slate-50 py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-slate-700 border-t-2 border-slate-200">
                  Nota final
                </td>
                {avaliacoes.map((a) => (
                  <td key={a.id} className="py-2.5 px-3 text-center border-t-2 border-slate-200 bg-slate-50">
                    <span className="text-base font-bold text-brand-700 tabular-nums">
                      {a.notaTotal === null ? '—' : a.notaTotal.toFixed(decimals)}
                    </span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Pareceres individuais */}
      <div className="space-y-3">
        {avaliacoes.map((a) => (
          <div key={a.id} className="p-3 sm:p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-slate-700">{a.nome}</span>
              <span className="text-xs text-slate-400">{a.data}</span>
            </div>
            {a.parecer ? (
              <p className="text-sm text-slate-600 leading-relaxed break-words">{a.parecer}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Sem parecer registrado.</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function FragmentBloco({
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
                    {fmtNota(nota)}
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
