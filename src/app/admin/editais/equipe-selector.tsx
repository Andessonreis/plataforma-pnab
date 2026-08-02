'use client'

import { useState } from 'react'
import { InlineFeedback } from '@/components/ui'
import { useFetchList } from '@/hooks/use-fetch-list'

export interface MembroEquipe {
  id: string
  nome: string
  email: string
}

type Funcao = 'AVALIADOR' | 'HABILITADOR'

const FUNCAO_CONFIG: Record<Funcao, { titulo: string; singular: string; endpoint: string }> = {
  AVALIADOR: { titulo: 'Avaliadores', singular: 'Avaliador', endpoint: '/api/admin/avaliadores' },
  HABILITADOR: { titulo: 'Habilitadores', singular: 'Habilitador', endpoint: '/api/admin/habilitadores' },
}

interface EquipeSelectorProps {
  funcao: Funcao
  value: MembroEquipe[]
  onChange: (next: MembroEquipe[]) => void
}

/**
 * Seletor de equipe (avaliadores/habilitadores) de um edital. Mantém a seleção em
 * estado local controlado pelo formulário pai — persiste apenas quando o form
 * inteiro é salvo, o que funciona tanto na criação (sem editalId ainda) quanto
 * na edição de um edital existente.
 */
export function EquipeSelector({ funcao, value, onChange }: EquipeSelectorProps) {
  const config = FUNCAO_CONFIG[funcao]
  const { data: elegiveis, loading } = useFetchList<MembroEquipe>(config.endpoint)
  const [selectedId, setSelectedId] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const membroIds = new Set(value.map((m) => m.id))
  const disponiveis = elegiveis.filter((e) => !membroIds.has(e.id))

  function handleAdd() {
    const membro = elegiveis.find((e) => e.id === selectedId)
    if (!membro) return
    onChange([...value, membro])
    setSelectedId('')
    setFeedback({ type: 'success', message: `${config.singular} adicionado(a)` })
  }

  function handleRemove(membro: MembroEquipe) {
    onChange(value.filter((m) => m.id !== membro.id))
    setConfirmRemoveId(null)
    setFeedback({ type: 'success', message: `${config.singular} removido(a)` })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{config.titulo}</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {value.length > 0
            ? `${value.length} ${config.singular.toLowerCase()}${value.length > 1 ? 'es' : ''}`
            : 'Nenhum (todos acessam)'}
        </span>
      </div>

      {feedback && (
        <div className="mb-3">
          <InlineFeedback type={feedback.type} message={feedback.message} />
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {value.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>
              {confirmRemoveId === m.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemove(m)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    aria-label={`Confirmar remoção de ${m.nome}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    aria-label="Cancelar remoção"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(m.id)}
                  className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  aria-label={`Remover ${m.nome}`}
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar {config.singular}</p>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : disponiveis.length === 0 ? (
          <p className="text-sm text-slate-400">
            {elegiveis.length === 0
              ? `Nenhum ${config.singular.toLowerCase()} cadastrado`
              : `Todos os ${config.singular.toLowerCase()}es já foram adicionados`}
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor={`equipe-select-${funcao}`} className="sr-only">
                Selecionar {config.singular.toLowerCase()}
              </label>
              <select
                id={`equipe-select-${funcao}`}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Selecionar...</option>
                {disponiveis.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome} ({e.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedId}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
