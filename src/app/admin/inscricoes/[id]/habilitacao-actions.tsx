'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Textarea } from '@/components/ui'
import type { InscricaoStatus } from '@prisma/client'

interface HabilitacaoActionsProps {
  inscricaoId: string
  currentStatus: InscricaoStatus
  motivoAtual: string
}

export function HabilitacaoActions({ inscricaoId, currentStatus, motivoAtual }: HabilitacaoActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState(motivoAtual)
  const [showInabilitar, setShowInabilitar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleHabilitar() {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/habilitacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'HABILITADA' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Erro ao habilitar.' })
        return
      }

      setMessage({ type: 'success', text: 'Inscricao habilitada com sucesso.' })
      router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleInabilitar(e: FormEvent) {
    e.preventDefault()

    if (!motivo.trim()) {
      setMessage({ type: 'error', text: 'O motivo da inabilitacao e obrigatorio.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/inscricoes/${inscricaoId}/habilitacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INABILITADA', motivo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Erro ao inabilitar.' })
        return
      }

      setMessage({ type: 'success', text: 'Inscricao inabilitada.' })
      router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Habilitacao</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <p className="text-sm text-slate-600 mb-4">
        Status atual: <strong>{currentStatus}</strong>
      </p>

      <div className="space-y-3">
        {currentStatus !== 'HABILITADA' && (
          <Button
            onClick={handleHabilitar}
            loading={loading}
            className="w-full"
          >
            Habilitar Inscricao
          </Button>
        )}

        {!showInabilitar && currentStatus !== 'INABILITADA' ? (
          <Button
            variant="danger"
            onClick={() => setShowInabilitar(true)}
            className="w-full"
          >
            Inabilitar Inscricao
          </Button>
        ) : (
          showInabilitar && (
            <form onSubmit={handleInabilitar} className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <Textarea
                label="Motivo da Inabilitacao"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                placeholder="Descreva o motivo da inabilitacao..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" loading={loading} size="sm">
                  Confirmar Inabilitacao
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInabilitar(false)
                    setMotivo(motivoAtual)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )
        )}
      </div>
    </Card>
  )
}
