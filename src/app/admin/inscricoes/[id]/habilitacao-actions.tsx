'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { InscricaoStatus } from '@prisma/client'

// Motivos padronizados conforme diretrizes PNAB
const MOTIVOS_PADRONIZADOS = [
  'Documentação obrigatória incompleta ou ausente',
  'CPF/CNPJ irregular, inválido ou com pendências',
  'Comprovante de residência inválido ou com prazo vencido',
  'Plano de trabalho incompleto, genérico ou fora do escopo do edital',
  'Assinatura ou autenticação ausente nos documentos exigidos',
  'Proponente não enquadrado no perfil elegível do edital',
  'Proponente com restrições cadastrais ativas',
  'Duplicidade de inscrição no mesmo edital',
  'Outro motivo (especificar abaixo)',
] as const

type MotivoPadrao = (typeof MOTIVOS_PADRONIZADOS)[number]

interface HabilitacaoActionsProps {
  inscricaoId: string
  currentStatus: InscricaoStatus
  motivoAtual: string
}

type Step = 'idle' | 'confirming-habilitar' | 'form-inabilitar'

export function HabilitacaoActions({ inscricaoId, currentStatus, motivoAtual: _motivoAtual }: HabilitacaoActionsProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [loading, setLoading] = useState(false)
  const [motivoPadrao, setMotivoPadrao] = useState<MotivoPadrao>(MOTIVOS_PADRONIZADOS[0])
  const [motivoComplemento, setMotivoComplemento] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function submitHabilitacao(payload: { status: 'HABILITADA' | 'INABILITADA'; motivo?: string }) {
    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/habilitacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: 'error', text: data.message ?? 'Erro ao processar solicitação.' })
        return
      }

      setFeedback({
        type: 'success',
        text:
          payload.status === 'HABILITADA'
            ? 'Inscrição habilitada com sucesso.'
            : 'Inscrição inabilitada.',
      })
      setStep('idle')
      router.refresh()
    } catch {
      setFeedback({ type: 'error', text: 'Falha na conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  function handleHabilitar() {
    submitHabilitacao({ status: 'HABILITADA' })
  }

  function handleInabilitar(e: FormEvent) {
    e.preventDefault()

    const motivoFinal =
      motivoPadrao === 'Outro motivo (especificar abaixo)'
        ? motivoComplemento.trim()
        : motivoComplemento.trim()
          ? `${motivoPadrao} — ${motivoComplemento.trim()}`
          : motivoPadrao

    if (!motivoFinal) {
      setFeedback({ type: 'error', text: 'Informe o motivo da inabilitação.' })
      return
    }

    submitHabilitacao({ status: 'INABILITADA', motivo: motivoFinal })
  }

  function openFormInabilitar() {
    setMotivoPadrao(MOTIVOS_PADRONIZADOS[0])
    setMotivoComplemento('')
    setFeedback(null)
    setStep('form-inabilitar')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Decisão de Habilitação</h2>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
          {currentStatus === 'HABILITADA'
            ? 'Habilitada'
            : currentStatus === 'INABILITADA'
              ? 'Inabilitada'
              : 'Pendente'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Feedback */}
        {feedback && (
          <div
            role="alert"
            className={[
              'flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm',
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200',
            ].join(' ')}
          >
            {feedback.type === 'success' ? (
              <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Estado idle — botões primários */}
        {step === 'idle' && (
          <>
            {currentStatus !== 'HABILITADA' && (
              <button
                type="button"
                onClick={() => { setFeedback(null); setStep('confirming-habilitar') }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-green-600 min-h-[44px]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Habilitar inscrição
              </button>
            )}

            {currentStatus !== 'INABILITADA' && (
              <button
                type="button"
                onClick={openFormInabilitar}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 hover:border-red-300 focus-visible:outline-2 focus-visible:outline-red-500 min-h-[44px]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Inabilitar inscrição
              </button>
            )}

            {currentStatus === 'HABILITADA' && (
              <button
                type="button"
                onClick={openFormInabilitar}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-400 min-h-[44px]"
              >
                Reverter para inabilitada
              </button>
            )}

            {currentStatus === 'INABILITADA' && (
              <button
                type="button"
                onClick={() => { setFeedback(null); setStep('confirming-habilitar') }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-400 min-h-[44px]"
              >
                Reverter para habilitada
              </button>
            )}
          </>
        )}

        {/* Confirmação de habilitação */}
        {step === 'confirming-habilitar' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
            <p className="text-sm text-green-900 font-medium">Confirmar habilitação?</p>
            <p className="text-xs text-green-800">
              A inscrição será marcada como <strong>Habilitada</strong> e encaminhada para a fase de avaliação.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleHabilitar}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 min-h-[44px]"
              >
                {loading ? 'Salvando…' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('idle'); setFeedback(null) }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Formulário de inabilitação */}
        {step === 'form-inabilitar' && (
          <form onSubmit={handleInabilitar} className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-4">
            <p className="text-sm font-medium text-slate-900">Motivo da inabilitação</p>

            <div className="space-y-1.5">
              <label htmlFor="motivo-padrao" className="block text-xs font-medium text-slate-600">
                Motivo principal
              </label>
              <select
                id="motivo-padrao"
                value={motivoPadrao}
                onChange={(e) => setMotivoPadrao(e.target.value as MotivoPadrao)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 min-h-[44px]"
              >
                {MOTIVOS_PADRONIZADOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="motivo-complemento" className="block text-xs font-medium text-slate-600">
                {motivoPadrao === 'Outro motivo (especificar abaixo)'
                  ? 'Descreva o motivo *'
                  : 'Detalhamento adicional (opcional)'}
              </label>
              <textarea
                id="motivo-complemento"
                value={motivoComplemento}
                onChange={(e) => setMotivoComplemento(e.target.value)}
                required={motivoPadrao === 'Outro motivo (especificar abaixo)'}
                rows={3}
                placeholder={
                  motivoPadrao === 'Outro motivo (especificar abaixo)'
                    ? 'Descreva com clareza o motivo da inabilitação…'
                    : 'Ex.: documento vencido em 10/01/2025, faltando página 3…'
                }
                className="block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 min-h-[44px]"
              >
                {loading ? 'Salvando…' : 'Confirmar inabilitação'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('idle'); setFeedback(null) }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
