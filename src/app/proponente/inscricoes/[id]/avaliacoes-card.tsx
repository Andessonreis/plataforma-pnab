import { formatDate } from '@/lib/utils/format'
import { formatNotaTotal } from '@/lib/services/avaliacao-view'
import type { AvaliacaoItem } from './types'

interface Props {
  avaliacoes: AvaliacaoItem[]
  resultadoVisivel: boolean
}

/** Seção da coluna lateral — sem Card próprio, compõe o painel único de status/metadados. */
export function AvaliacoesCard({ avaliacoes, resultadoVisivel }: Props) {
  if (!resultadoVisivel || avaliacoes.length === 0) return null

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3">Avaliações</h3>
      <ul className="divide-y divide-slate-100">
        {avaliacoes.map((avaliacao, i) => (
          <li key={i} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">Avaliação {i + 1}</span>
              <span className="text-base font-semibold text-brand-700">{formatNotaTotal(avaliacao)}</span>
            </div>
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
