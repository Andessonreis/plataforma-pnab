'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'

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
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar Inscrição
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Atenção</p>
        <p className="text-sm text-amber-700">
          Sua inscrição será retirada e voltará ao status de rascunho.
          Você precisará reenviá-la após as alterações.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
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
