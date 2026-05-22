'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@client/components/ui'
import { editaisClient } from '@client/api/editais.client'

interface Membro {
  id: string
  nome: string
  email: string
}

interface EquipeEditorProps {
  editalId: string
  initialAvaliadores: Membro[]
  initialHabilitadores: Membro[]
}

type Funcao = 'AVALIADOR' | 'HABILITADOR'

interface FeedbackMsg {
  type: 'success' | 'error'
  message: string
}

// ── Bloco interno para cada função (avaliador/habilitador) ──────────────────

function EquipeBloco({
  editalId,
  funcao,
  label,
  initialMembros,
  elegíveis,
  loadingElegíveis,
  onMemberChange,
}: {
  editalId: string
  funcao: Funcao
  label: string
  initialMembros: Membro[]
  elegíveis: Membro[]
  loadingElegíveis: boolean
  onMemberChange: () => void
}) {
  const [membros, setMembros] = useState(initialMembros)
  const [selectedId, setSelectedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const membrosIds = new Set(membros.map((m) => m.id))
  const disponíveis = elegíveis.filter((e) => !membrosIds.has(e.id))

  async function handleAdd() {
    if (!selectedId || submitting) return
    setSubmitting(true)
    setFeedback(null)

    try {
      await editaisClient.addEquipe(editalId, [selectedId], funcao)
      const added = elegíveis.find((e) => e.id === selectedId)
      if (added) setMembros((prev) => [...prev, added])
      setSelectedId('')
      setFeedback({ type: 'success', message: `${label} adicionado(a)` })
      onMemberChange()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao adicionar' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(userId: string) {
    setSubmitting(true)
    setFeedback(null)
    setConfirmRemove(null)

    try {
      await editaisClient.removeEquipe(editalId, userId, funcao)
      setMembros((prev) => prev.filter((m) => m.id !== userId))
      setFeedback({ type: 'success', message: `${label} removido(a)` })
      onMemberChange()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao remover' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{label}es</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {membros.length > 0 ? `${membros.length} ${label.toLowerCase()}${membros.length > 1 ? 'es' : ''}` : 'Nenhum (todos acessam)'}
        </span>
      </div>

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

      {/* Lista de membros */}
      {membros.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {membros.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>
              {confirmRemove === m.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    disabled={submitting}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    aria-label={`Confirmar remoção de ${m.nome}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    aria-label="Cancelar remoção"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(m.id)}
                  disabled={submitting}
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

      {/* Adicionar */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Adicionar {label}</p>
        {loadingElegíveis ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : disponíveis.length === 0 ? (
          <p className="text-sm text-slate-400">
            {elegíveis.length === 0
              ? `Nenhum ${label.toLowerCase()} cadastrado`
              : `Todos os ${label.toLowerCase()}es já foram adicionados`}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`select-${funcao}`} className="sr-only">
                Selecionar {label.toLowerCase()}
              </label>
              <select
                id={`select-${funcao}`}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Selecionar...</option>
                {disponíveis.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome} ({e.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedId || submitting}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white font-medium text-sm px-4 min-h-[44px] hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal EquipeEditor ───────────────────────────────────────

export function EquipeEditor({ editalId, initialAvaliadores, initialHabilitadores }: EquipeEditorProps) {
  const [allAvaliadores, setAllAvaliadores] = useState<Membro[]>([])
  const [allHabilitadores, setAllHabilitadores] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)

  const fetchElegíveis = useCallback(async () => {
    try {
      const [resAval, resHab] = await Promise.all([
        fetch('/api/admin/avaliadores'),
        fetch('/api/admin/habilitadores'),
      ])

      if (resAval.ok) {
        const json = await resAval.json()
        setAllAvaliadores(json.data.map((a: Membro & { pendingCount?: number }) => ({
          id: a.id,
          nome: a.nome,
          email: a.email,
        })))
      }

      if (resHab.ok) {
        const json = await resHab.json()
        setAllHabilitadores(json.data)
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchElegíveis()
  }, [fetchElegíveis])

  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Equipe do Edital</h2>
      <p className="text-xs text-slate-500 mb-4">
        Defina quais avaliadores e habilitadores trabalham neste edital. Se nenhum for atribuído, todos com o respectivo cargo terão acesso.
      </p>

      <div className="space-y-6">
        <EquipeBloco
          editalId={editalId}
          funcao="HABILITADOR"
          label="Habilitador"
          initialMembros={initialHabilitadores}
          elegíveis={allHabilitadores}
          loadingElegíveis={loading}
          onMemberChange={() => {}}
        />

        <div className="border-t border-slate-200" />

        <EquipeBloco
          editalId={editalId}
          funcao="AVALIADOR"
          label="Avaliador"
          initialMembros={initialAvaliadores}
          elegíveis={allAvaliadores}
          loadingElegíveis={loading}
          onMemberChange={() => {}}
        />
      </div>
    </Card>
  )
}
