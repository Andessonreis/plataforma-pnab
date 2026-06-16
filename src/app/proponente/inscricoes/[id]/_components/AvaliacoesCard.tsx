import { Card } from '@client/components/ui'
import { formatNotaTotal } from '@/lib/services/avaliacao-view'

interface AvaliacaoView {
  notaTotal: unknown
  parecer: string | null
  finalizada: boolean
  createdAt: Date
}

interface AvaliacoesCardProps {
  avaliacoes: AvaliacaoView[]
}

export function AvaliacoesCard({ avaliacoes }: AvaliacoesCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Avaliações</h2>
      <div className="space-y-3">
        {avaliacoes.map((avaliacao, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Avaliação {i + 1}</span>
              <span className="text-lg font-bold text-brand-700">{formatNotaTotal(avaliacao)}</span>
            </div>
            {avaliacao.parecer && (
              <p className="text-xs text-slate-500 mt-1 break-words">{avaliacao.parecer}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
