'use client'

import type { MembroEquipe } from '../constants'

export function SeletorMembros({
  titulo,
  labelSingular,
  labelPluralSufixo,
  selectId,
  selectLabel,
  selecionados,
  todos,
  loading,
  selectedId,
  setSelectedId,
  onAdd,
  onRemove,
  emptyCadastroLabel,
  emptyTodosLabel,
}: {
  titulo: string
  labelSingular: string
  labelPluralSufixo: string
  selectId: string
  selectLabel: string
  selecionados: MembroEquipe[]
  todos: MembroEquipe[]
  loading: boolean
  selectedId: string
  setSelectedId: (v: string) => void
  onAdd: (membro: MembroEquipe) => void
  onRemove: (id: string) => void
  emptyCadastroLabel: string
  emptyTodosLabel: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {selecionados.length > 0
            ? `${selecionados.length} ${labelSingular}${selecionados.length > 1 ? labelPluralSufixo : ''}`
            : 'Nenhum (todos acessam)'}
        </span>
      </div>

      {selecionados.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {selecionados.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                aria-label={`Remover ${m.nome}`}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar {labelSingular.charAt(0).toUpperCase() + labelSingular.slice(1)}</p>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : (() => {
          const ids = new Set(selecionados.map(s => s.id))
          const disponíveis = todos.filter(m => !ids.has(m.id))
          return disponíveis.length === 0 ? (
            <p className="text-sm text-slate-400">
              {todos.length === 0 ? emptyCadastroLabel : emptyTodosLabel}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={selectId} className="sr-only">{selectLabel}</label>
                <select
                  id={selectId}
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
                >
                  <option value="">Selecionar...</option>
                  {disponíveis.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.email})</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const membro = todos.find(m => m.id === selectedId)
                  if (membro) {
                    onAdd(membro)
                    setSelectedId('')
                  }
                }}
                disabled={!selectedId}
                className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Adicionar
              </button>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
