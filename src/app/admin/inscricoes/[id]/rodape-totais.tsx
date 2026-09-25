import { ValorRevisado } from '@/components/avaliacao/valor-revisado'
import type { AvaliacaoView } from './avaliacoes-comparativo'
import { fmtNota } from './bloco-criterios'

interface RodapeTotaisProps {
  avaliacoes: AvaliacaoView[]
  pontuacoesBrutas: number[]
  /** Pontuação bruta antes da revisão no recurso; null onde não houve revisão. */
  brutasAntes: (number | null)[]
  hasFormula: boolean
  decimals: number
}

/**
 * Linha de totais da tabela comparativa: a pontuação bruta (edital com fórmula)
 * ou a nota final de cada avaliador, com o valor anterior riscado quando a
 * comissão revisou a avaliação ao julgar o recurso.
 */
export function RodapeTotais({ avaliacoes, pontuacoesBrutas, brutasAntes, hasFormula, decimals }: RodapeTotaisProps) {
  return (
    <tfoot>
      {hasFormula ? (
        <tr>
          <td className="sticky left-0 z-10 bg-slate-50 py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-slate-700 border-t-2 border-slate-200">
            Pontuação bruta
          </td>
          {pontuacoesBrutas.map((pontos, i) => (
            <td key={avaliacoes[i].id} className="py-2.5 px-3 text-center border-t-2 border-slate-200 bg-slate-50">
              <span className="text-base font-bold text-brand-700 tabular-nums">
                {brutasAntes[i] === null
                  ? `${fmtNota(pontos)} pts`
                  : <ValorRevisado anterior={`${fmtNota(brutasAntes[i] as number)} pts`} atual={`${fmtNota(pontos)} pts`} />}
              </span>
            </td>
          ))}
        </tr>
      ) : (
        <tr>
          <td className="sticky left-0 z-10 bg-slate-50 py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-slate-700 border-t-2 border-slate-200">
            Nota final
          </td>
          {avaliacoes.map((a) => (
            <td key={a.id} className="py-2.5 px-3 text-center border-t-2 border-slate-200 bg-slate-50">
              <span className="text-base font-bold text-brand-700 tabular-nums">
                {a.notaTotal === null ? '—' : a.revisao && a.revisao.notaTotalAnterior !== a.notaTotal
                  ? <ValorRevisado anterior={a.revisao.notaTotalAnterior.toFixed(decimals)} atual={a.notaTotal.toFixed(decimals)} />
                  : a.notaTotal.toFixed(decimals)}
              </span>
            </td>
          ))}
        </tr>
      )}
    </tfoot>
  )
}
