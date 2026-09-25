import { formatDate } from '@/lib/utils/format'
import { formatNotaTotal, viewNotaTotal } from '@/lib/services/avaliacao-view'
import { lerRevisaoRecurso } from '@/lib/avaliacao/revisao-recurso'
import { SeloRevisadaNoRecurso, ValorRevisado } from '@/components/avaliacao/valor-revisado'
import type { AvaliacaoItem } from './types'

interface Props {
  avaliacoes: AvaliacaoItem[]
  resultadoVisivel: boolean
  /** O resultado final já foi publicado — só então a revisão feita no recurso aparece. */
  resultadoFinalLiberado: boolean
}

/**
 * Nota de uma avaliação como o proponente a vê.
 *
 * A revisão feita no julgamento do recurso só aparece depois do resultado final:
 * até lá a nota é a original, porque mostrar a nova antes revelaria a decisão do
 * recurso antes da publicação oficial. Depois, a original fica riscada ao lado.
 */
function NotaDaAvaliacao({ avaliacao, resultadoFinalLiberado }: { avaliacao: AvaliacaoItem; resultadoFinalLiberado: boolean }) {
  const revisao = lerRevisaoRecurso(avaliacao.revisaoRecurso)
  const nota = viewNotaTotal(avaliacao)
  if (!revisao || nota === null) return <>{formatNotaTotal(avaliacao)}</>
  if (!resultadoFinalLiberado) return <>{revisao.notaTotalAnterior.toFixed(2)}</>
  if (revisao.notaTotalAnterior === nota) return <>{nota.toFixed(2)}</>
  return <ValorRevisado anterior={revisao.notaTotalAnterior.toFixed(2)} atual={nota.toFixed(2)} />
}

/** Seção da coluna lateral — sem Card próprio, compõe o painel único de status/metadados. */
export function AvaliacoesCard({ avaliacoes, resultadoVisivel, resultadoFinalLiberado }: Props) {
  if (!resultadoVisivel || avaliacoes.length === 0) return null

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3">Avaliações</h3>
      <ul className="divide-y divide-slate-100">
        {avaliacoes.map((avaliacao, i) => (
          <li key={i} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">Avaliação {i + 1}</span>
              <span className="text-base font-semibold text-brand-700">
                <NotaDaAvaliacao avaliacao={avaliacao} resultadoFinalLiberado={resultadoFinalLiberado} />
              </span>
            </div>
            {resultadoFinalLiberado && lerRevisaoRecurso(avaliacao.revisaoRecurso) && (
              <SeloRevisadaNoRecurso className="mt-1" />
            )}
            {avaliacao.parecer && (
              <p className="text-xs text-slate-500 mt-1 break-words">{avaliacao.parecer}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{formatDate(avaliacao.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
