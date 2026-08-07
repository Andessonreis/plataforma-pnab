'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, IconEdit } from '@/components/ui'

interface RetractAndEditButtonProps {
  inscricaoId: string
}

export function RetractAndEditButton({ inscricaoId }: RetractAndEditButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRetract() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/retract`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao retirar inscrição.')
        setLoading(false)
        return
      }

      router.push(`/proponente/inscricoes/${inscricaoId}/editar`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
      >
        <IconEdit className="h-4 w-4" />
        Editar Inscrição
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-accent-700 mb-1">Atenção</p>
        <p className="text-sm text-slate-600">
          Sua inscrição será retirada e voltará ao status de rascunho.
          Você precisará reenviá-la após as alterações.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleRetract}
          loading={loading}
          className="flex-1"
          size="sm"
        >
          Confirmar e editar
        </Button>
        <Button
          variant="outline"
          onClick={() => { setShowConfirm(false); setError('') }}
          disabled={loading}
          size="sm"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
