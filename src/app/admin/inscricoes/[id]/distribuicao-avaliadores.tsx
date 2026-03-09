'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'

interface Avaliador {
  id: string
  nome: string
  email: string
  pendingCount: number
}

interface AvaliacaoAtribuida {
  avaliadorId: string
  avaliadorNome: string
  finalizada: boolean
  notaTotal: number
}

interface Props {
  inscricaoId: string
  avaliacoes: {
    avaliador: { id: string; nome: string }
    finalizada: boolean
    notaTotal: unknown
  }[]
}

export function DistribuicaoAvaliadores({ inscricaoId, avaliacoes }: Props) {
  const router = useRouter()
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  // Mapa de avaliações atribuídas
  const atribuidos: AvaliacaoAtribuida[] = avaliacoes.map((a) => ({
    avaliadorId: a.avaliador.id,
    avaliadorNome: a.avaliador.nome,
    finalizada: a.finalizada,
    notaTotal: parseFloat(String(a.notaTotal)),
  }))

  const atribuidosIds = new Set(atribuidos.map((a) => a.avaliadorId))

  const fetchAvaliadores = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/avaliadores')
      if (res.ok) {
        const json = await res.json()
        setAvaliadores(json.data)
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvaliadores()
  }, [fetchAvaliadores])

  const disponíveis = avaliadores.filter((a) => !atribuidosIds.has(a.id))

  async function handleAssign() {
    if (!selectedId || submitting) return
    setSubmitting(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliadorIds: [selectedId] }),
      })

      if (res.ok) {
        setSelectedId('')
        setFeedback({ type: 'success', message: 'Avaliador atribuído com sucesso' })
        router.refresh()
      } else {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.message || 'Erro ao atribuir avaliador' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(avaliadorId: string) {
    setSubmitting(true)
    setFeedback(null)
    setConfirmRemove(null)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avaliadorId }),
      })

      if (res.ok) {
        setFeedback({ type: 'success', message: 'Avaliador removido' })
        router.refresh()
      } else {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.message || 'Erro ao remover avaliador' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
        Distribuição para Avaliadores
      </h2>

      {/* Feedback */}
      {feedback && (
        <div
          role="alert"
          className={[
            'text-sm rounded-lg px-3 py-2 mb-3',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200',
          ].join(' ')}
        >
          {feedback.message}
        </div>
      )}

      {/* Lista de avaliadores atribuídos */}
      {atribuidos.length > 0 ? (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Atribuídos ({atribuidos.length})</p>
          {atribuidos.map((a) => (
            <div
              key={a.avaliadorId}
              className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{a.avaliadorNome}</p>
                <p className="text-xs text-slate-500">
                  {a.finalizada ? (
                    <span className="text-emerald-700">Nota {a.notaTotal.toFixed(1)}</span>
                  ) : (
                    <span className="text-amber-600">Pendente</span>
                  )}
                </p>
              </div>
              {a.finalizada ? (
                <span
                  className="shrink-0 text-[11px] text-slate-400 px-2 py-1"
                  title="Avaliação finalizada — não pode ser removida"
                >
                  Finalizada
                </span>
              ) : confirmRemove === a.avaliadorId ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemove(a.avaliadorId)}
                    disabled={submitting}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 rounded"
                    aria-label={`Confirmar remoção de ${a.avaliadorNome}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 rounded"
                    aria-label="Cancelar remoção"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(a.avaliadorId)}
                  disabled={submitting}
                  className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 rounded"
                  aria-label={`Remover ${a.avaliadorNome}`}
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4">Nenhum avaliador atribuído.</p>
      )}

      {/* Adicionar avaliador */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar Avaliador</p>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando avaliadores...</p>
        ) : disponíveis.length === 0 ? (
          <p className="text-sm text-slate-400">
            {avaliadores.length === 0
              ? 'Nenhum avaliador cadastrado'
              : 'Todos os avaliadores já foram atribuídos'}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="select-avaliador" className="sr-only">
                Selecionar avaliador
              </label>
              <select
                id="select-avaliador"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
                aria-label="Selecionar avaliador para atribuição"
              >
                <option value="">Selecionar avaliador...</option>
                {disponíveis.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.pendingCount} pendente{a.pendingCount !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedId || submitting}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              aria-label="Atribuir avaliador selecionado"
            >
              {submitting ? 'Atribuindo...' : 'Atribuir'}
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
