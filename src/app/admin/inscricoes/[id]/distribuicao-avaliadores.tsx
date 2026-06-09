import { Card } from '@client/components/ui'

interface Props {
  /** Exibição somente leitura — a atribuição de avaliadores não ocorre nesta tela. */
  readOnly: true
  avaliacoes: {
    avaliador: { id: string; nome: string }
    finalizada: boolean
    notaTotal: number | null
  }[]
}

export function DistribuicaoAvaliadores({ avaliacoes }: Props) {
  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        Distribuição para Avaliadores
      </h2>

      {avaliacoes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Atribuídos ({avaliacoes.length})</p>
          {avaliacoes.map((a) => (
            <div
              key={a.avaliador.id}
              className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{a.avaliador.nome}</p>
                <p className="text-xs text-slate-500">
                  {a.finalizada && a.notaTotal !== null ? (
                    <span className="text-emerald-700">Nota {a.notaTotal.toFixed(1)}</span>
                  ) : (
                    <span className="text-amber-600">Pendente</span>
                  )}
                </p>
              </div>
              {a.finalizada && (
                <span className="shrink-0 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Finalizada
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nenhum avaliador atribuído.</p>
      )}
    </Card>
  )
}
