'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ResultActionsProps {
  editalId: string
  editalStatus: string
  /** Há avaliação finalizada para consolidar? Sem isso não há o que publicar. */
  temAvaliacoes?: boolean
  /** Notas já gravadas (resultado já consolidado/publicado nesta fase). */
  consolidado?: boolean
}

export function ResultActions({
  editalId,
  editalStatus,
  temAvaliacoes = true,
  consolidado = false,
}: ResultActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  async function handlePublish(fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL') {
    setLoading(fase)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/editais/${editalId}/resultados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message ?? 'Erro ao publicar.' })
        return
      }

      setMessage({ type: 'success', text: data.message })
      setConfirmAction(null)
      // Recarrega a página para refletir mudanças
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão.' })
    } finally {
      setLoading(null)
    }
  }

  const preliminarPublicado = consolidado && ['RESULTADO_PRELIMINAR', 'RECURSO'].includes(editalStatus)
  const finalPublicado = consolidado && editalStatus === 'RESULTADO_FINAL'
  const canPublishPreliminar =
    !preliminarPublicado &&
    !finalPublicado &&
    ['INSCRICOES_ENCERRADAS', 'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR'].includes(editalStatus)
  const canPublishFinal = !finalPublicado && ['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL'].includes(editalStatus)
  const bloqueado = !temAvaliacoes

  return (
    <div className="space-y-4">
      {bloqueado && (canPublishPreliminar || canPublishFinal) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Nenhuma avaliação finalizada para consolidar. A publicação fica disponível quando os avaliadores concluírem as notas.
        </div>
      )}

      {/* Mensagem de feedback */}
      {message && (
        <div
          className={[
            'rounded-lg p-3 text-sm font-medium',
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* Estado: resultado já publicado nesta fase */}
        {preliminarPublicado && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Resultado preliminar publicado
          </span>
        )}
        {finalPublicado && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Resultado final publicado
          </span>
        )}

        {/* Publicar Resultado Preliminar */}
        {canPublishPreliminar && (
          <>
            {confirmAction === 'RESULTADO_PRELIMINAR' ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className="text-sm text-amber-800">
                  Confirma publicação do resultado preliminar?
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handlePublish('RESULTADO_PRELIMINAR')}
                  disabled={!!loading}
                >
                  {loading === 'RESULTADO_PRELIMINAR' ? 'Publicando...' : 'Confirmar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmAction(null)}
                  disabled={!!loading}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => setConfirmAction('RESULTADO_PRELIMINAR')}
                disabled={!!loading || bloqueado}
              >
                Publicar Resultado Preliminar
              </Button>
            )}
          </>
        )}

        {/* Publicar Resultado Final */}
        {canPublishFinal && (
          <>
            {confirmAction === 'RESULTADO_FINAL' ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <span className="text-sm text-red-800">
                  Confirma publicação do resultado FINAL? Esta ação é definitiva.
                </span>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handlePublish('RESULTADO_FINAL')}
                  disabled={!!loading}
                >
                  {loading === 'RESULTADO_FINAL' ? 'Publicando...' : 'Publicar Final'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmAction(null)}
                  disabled={!!loading}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                className="bg-brand-700 hover:bg-brand-800 text-white"
                onClick={() => setConfirmAction('RESULTADO_FINAL')}
                disabled={!!loading || bloqueado}
              >
                Publicar Resultado Final
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
