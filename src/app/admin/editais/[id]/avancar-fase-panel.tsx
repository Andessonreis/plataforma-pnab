'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EditalStatus } from '@prisma/client'
import { Button } from '@client/components/ui'
import { editalStatusLabel } from '@/lib/status-maps'
import { editaisClient } from '@client/api/editais.client'

interface Props {
  editalId: string
  statusAtual: EditalStatus
}

const SEQUENCIA: EditalStatus[] = [
  'RASCUNHO',
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

const ACAO_LABEL: Record<EditalStatus, string> = {
  RASCUNHO: 'Voltar a Rascunho',
  PUBLICADO: 'Publicar edital',
  INSCRICOES_ABERTAS: 'Abrir inscrições',
  INSCRICOES_ENCERRADAS: 'Encerrar inscrições',
  HABILITACAO: 'Iniciar habilitação',
  AVALIACAO: 'Iniciar avaliação',
  RESULTADO_PRELIMINAR: 'Publicar resultado preliminar',
  RECURSO: 'Abrir prazo de recursos',
  RESULTADO_FINAL: 'Publicar resultado final',
  ENCERRADO: 'Encerrar edital',
}

export function AvancarFasePanel({ editalId, statusAtual }: Props) {
  const router = useRouter()
  const idxAtual = SEQUENCIA.indexOf(statusAtual)
  const proximoStatus = idxAtual >= 0 && idxAtual < SEQUENCIA.length - 1
    ? SEQUENCIA[idxAtual + 1]
    : null

  const [confirmando, setConfirmando] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!proximoStatus) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Edital encerrado. Não há próxima fase para avançar.
        </p>
      </div>
    )
  }

  async function executar() {
    if (!proximoStatus) return
    if (justificativa.trim().length < 10) {
      setFeedback({ type: 'error', text: 'A justificativa precisa ter ao menos 10 caracteres.' })
      return
    }
    setLoading(true)
    setFeedback(null)

    try {
      const result = await editaisClient.avancarFase(editalId, proximoStatus, justificativa.trim())
      setFeedback({
        type: 'success',
        text: `Edital atualizado para ${result.novoStatus}.`,
      })
      setConfirmando(false)
      setJustificativa('')
      router.refresh()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha de conexão. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
      {/* Cabeçalho com aviso */}
      <div className="px-4 py-3 bg-amber-100 border-b border-amber-300">
        <div className="flex items-start gap-2.5">
          <svg className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-900">Avançar fase manualmente</h3>
            <p className="text-xs text-amber-800 mt-0.5">
              <strong>Use apenas em casos específicos.</strong> O sistema avança automaticamente
              quando chegar a data e hora configuradas no cronograma. Esta ação fica registrada em auditoria.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {feedback && (
          <div
            role="alert"
            className={[
              'rounded-lg px-3 py-2 text-sm',
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200',
            ].join(' ')}
          >
            {feedback.text}
          </div>
        )}

        <div className="text-sm text-slate-700">
          <p>
            Status atual: <strong>{editalStatusLabel[statusAtual]}</strong>
          </p>
          <p className="mt-1">
            Próxima fase: <strong>{editalStatusLabel[proximoStatus]}</strong>
          </p>
        </div>

        {!confirmando ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setFeedback(null); setConfirmando(true) }}
          >
            {ACAO_LABEL[proximoStatus]}
          </Button>
        ) : (
          <div className="rounded-lg border border-amber-300 bg-white p-3 space-y-3">
            <div>
              <label htmlFor="justificativa-fase" className="block text-xs font-semibold text-amber-900">
                Justificativa (obrigatória, mín. 10 caracteres)
              </label>
              <textarea
                id="justificativa-fase"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
                placeholder="Ex.: encerramento antecipado por decisão administrativa, processo XYZ..."
                className="mt-1 block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Será registrada em auditoria com seu usuário, data, status anterior e novo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={executar}
                disabled={loading}
              >
                {loading ? 'Aplicando…' : `Confirmar — ${ACAO_LABEL[proximoStatus]}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setConfirmando(false); setJustificativa(''); setFeedback(null) }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
