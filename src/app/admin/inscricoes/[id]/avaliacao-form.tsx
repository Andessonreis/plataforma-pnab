'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface CriterioConfig {
  criterio: string
  peso: number
  descricao?: string
  notaMax: number
}

interface NotaItem {
  criterio: string
  nota: number
  peso: number
}

interface AvaliacaoData {
  id: string
  notas: NotaItem[]
  parecer: string | null
  notaTotal: string | number
  finalizada: boolean
  updatedAt: string
}

interface AvaliacaoFormProps {
  inscricaoId: string
  inscricaoNumero: string
  criterios: CriterioConfig[]
  initialAvaliacao: AvaliacaoData | null
  isAdmin?: boolean
}

function notaColor(nota: number): string {
  if (nota >= 7) return 'text-emerald-700 bg-emerald-50'
  if (nota >= 5) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

function totalColor(nota: number): string {
  if (nota >= 7) return 'text-emerald-700'
  if (nota >= 5) return 'text-amber-600'
  return 'text-red-600'
}

function calcTotal(notas: NotaItem[]): number {
  const totalPeso = notas.reduce((acc, n) => acc + n.peso, 0)
  if (totalPeso === 0) return 0
  return notas.reduce((acc, n) => acc + (n.nota * n.peso) / totalPeso, 0)
}

export function AvaliacaoForm({
  inscricaoId,
  inscricaoNumero,
  criterios,
  initialAvaliacao,
  isAdmin = false,
}: AvaliacaoFormProps) {
  const router = useRouter()

  const buildInitialNotas = useCallback((): NotaItem[] => {
    if (initialAvaliacao?.notas?.length) {
      const existingMap = new Map(
        (initialAvaliacao.notas as NotaItem[]).map((n) => [n.criterio, n.nota]),
      )
      return criterios.map((c) => ({
        criterio: c.criterio,
        nota: existingMap.get(c.criterio) ?? 0,
        peso: c.peso,
      }))
    }
    return criterios.map((c) => ({ criterio: c.criterio, nota: 0, peso: c.peso }))
  }, [criterios, initialAvaliacao])

  const [notas, setNotas] = useState<NotaItem[]>(buildInitialNotas)
  const [parecer, setParecer] = useState(initialAvaliacao?.parecer ?? '')
  const [finalizada, setFinalizada] = useState(initialAvaliacao?.finalizada ?? false)
  const [loading, setLoading] = useState<'draft' | 'finalize' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(
    initialAvaliacao?.updatedAt
      ? new Date(initialAvaliacao.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : null,
  )

  const total = calcTotal(notas)
  const isLocked = finalizada && !isAdmin

  function updateNota(criterio: string, value: number) {
    setNotas((prev) => prev.map((n) => (n.criterio === criterio ? { ...n, nota: value } : n)))
    setFeedback(null)
  }

  async function submit(finalizar: boolean) {
    setLoading(finalizar ? 'finalize' : 'draft')
    setFeedback(null)
    setShowConfirm(false)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/avaliacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas, parecer: parecer.trim() || undefined, finalizar }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: 'error', text: data.message ?? 'Erro ao salvar. Tente novamente.' })
        return
      }

      if (finalizar) setFinalizada(true)
      setSavedAt(new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))
      setFeedback({ type: 'success', text: data.message })
      router.refresh()
    } catch {
      setFeedback({ type: 'error', text: 'Falha na conexão. Verifique sua internet e tente novamente.' })
    } finally {
      setLoading(null)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
  }

  // ─── Vista finalizada ────────────────────────────────────────────────────

  if (isLocked) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Minha Avaliação</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M9 7l3-3 3 3M5 10l-1.293 1.293a1 1 0 000 1.414L5 14" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 11V9a3 3 0 016 0v2m-7 5h8a2 2 0 002-2v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            Finalizada
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Nota total destaque */}
          <div className="text-center py-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500 mb-1">Nota Final Ponderada</p>
            <p className={`text-4xl font-bold tabular-nums ${totalColor(parseFloat(String(initialAvaliacao?.notaTotal ?? 0)))}`}>
              {parseFloat(String(initialAvaliacao?.notaTotal ?? 0)).toFixed(1)}
              <span className="text-lg font-normal text-slate-400 ml-0.5">/10</span>
            </p>
          </div>

          {/* Notas por critério */}
          <div className="space-y-2">
            {notas.map((n) => (
              <div key={n.criterio} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">{n.criterio}</p>
                  <p className="text-xs text-slate-400">peso {n.peso}%</p>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ml-3 px-2 py-0.5 rounded ${notaColor(n.nota)}`}>
                  {n.nota.toFixed(1)}
                </span>
              </div>
            ))}
          </div>

          {/* Parecer */}
          {parecer && (
            <div className="pt-1">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Parecer Técnico</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{parecer}</p>
            </div>
          )}

          {savedAt && (
            <p className="text-xs text-slate-400 pt-1">Finalizado em {savedAt}</p>
          )}
        </div>
      </div>
    )
  }

  // ─── Formulário de avaliação ─────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Avaliação de Mérito</h2>
            <p className="text-xs text-slate-400 mt-0.5">{inscricaoNumero}</p>
          </div>
          {savedAt && !feedback && (
            <span className="text-[11px] text-slate-400">Salvo {savedAt}</span>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* Feedback */}
          {feedback && (
            <div
              role="alert"
              className={[
                'flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm',
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800',
              ].join(' ')}
            >
              {feedback.type === 'success' ? (
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Total ponderado */}
          <div className="flex items-center justify-between py-3 px-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-600">Nota ponderada atual</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculada automaticamente</p>
            </div>
            <p className={`text-3xl font-bold tabular-nums ${totalColor(total)}`}>
              {total.toFixed(1)}
              <span className="text-base font-normal text-slate-400 ml-0.5">/10</span>
            </p>
          </div>

          {/* Critérios */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Critérios de Avaliação</p>
            {criterios.map((c, idx) => {
              const notaItem = notas[idx]
              const notaVal = notaItem?.nota ?? 0
              return (
                <div key={c.criterio} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`nota-${idx}`}
                        className="text-sm font-medium text-slate-800"
                      >
                        {c.criterio}
                      </label>
                      {c.descricao && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{c.descricao}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
                      {c.peso}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id={`nota-${idx}`}
                      min={0}
                      max={c.notaMax}
                      step={0.5}
                      value={notaVal}
                      onChange={(e) => updateNota(c.criterio, parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-brand-600 cursor-pointer"
                      aria-label={`Nota para ${c.criterio}`}
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={c.notaMax}
                        step={0.5}
                        value={notaVal}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v)) updateNota(c.criterio, Math.min(c.notaMax, Math.max(0, v)))
                        }}
                        className={[
                          'w-14 text-center text-sm font-bold rounded-lg border px-1.5 py-1 tabular-nums',
                          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                          notaVal >= 7
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : notaVal >= 5
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700',
                        ].join(' ')}
                        aria-label={`Valor numérico para ${c.criterio}`}
                      />
                      <span className="text-xs text-slate-400">/{c.notaMax}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Parecer */}
          <div>
            <label htmlFor="parecer" className="block text-sm font-medium text-slate-800 mb-1.5">
              Parecer Técnico
              <span className="ml-1.5 text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="parecer"
              rows={5}
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
              placeholder="Descreva sua análise qualitativa sobre a proposta: pontos fortes, fragilidades, potencial de impacto cultural..."
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 rounded-lg border border-slate-200 px-3.5 py-2.5 resize-y leading-relaxed
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
            />
            <p className="text-right text-[11px] text-slate-400 mt-1">{parecer.length} caracteres</p>
          </div>

          {/* Aviso finalização */}
          {showConfirm && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3.5 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <svg className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">Confirmar finalização</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-snug">
                    Após finalizar, esta avaliação ficará bloqueada para edição. Nota: <strong>{total.toFixed(1)}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={loading !== null}
                  className="flex-1 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  {loading === 'finalize' ? 'Finalizando…' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition-colors min-h-[40px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Ações */}
          {!showConfirm && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={loading !== null}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loading === 'draft' ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Salvar rascunho
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={loading !== null}
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Finalizar avaliação
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
