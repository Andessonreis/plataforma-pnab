import { ValorRevisado } from '@/components/avaliacao/valor-revisado'
import type { NotaFinalRevisada } from '@/lib/avaliacao/resumo'

interface PontuacaoFinalProps {
  nota: number
  hasFormula: boolean
  /** Valores de antes e depois da revisão do recurso, quando ela afeta a nota final. */
  revisao: NotaFinalRevisada | null
}

/** Nota final da inscrição no Resumo; com revisão de recurso, o valor antigo aparece riscado. */
export function PontuacaoFinal({ nota, hasFormula, revisao }: PontuacaoFinalProps) {
  const casas = hasFormula ? 2 : 1

  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase">{hasFormula ? 'Pontuação Final' : 'Nota Final'}</dt>
      <dd className="text-2xl font-bold text-brand-700 tabular-nums">
        {revisao
          ? <ValorRevisado anterior={revisao.anterior.toFixed(casas)} atual={revisao.atual.toFixed(casas)} />
          : nota.toFixed(casas)}
        {hasFormula && <span className="text-sm font-normal text-slate-400 ml-1">pts</span>}
      </dd>
    </div>
  )
}
