'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ResultActionsProps {
  editalId: string
  editalStatus: string
}

export function ResultActions({ editalId, editalStatus }: ResultActionsProps) {
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

  const canPublishPreliminar = ['AVALIACAO', 'HABILITACAO'].includes(editalStatus)
  const canPublishFinal = ['RESULTADO_PRELIMINAR', 'RECURSO'].includes(editalStatus)

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap gap-3">
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
                disabled={!!loading}
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
                disabled={!!loading}
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
