'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseInscricaoApiSubmitParams {
  inscricaoId: string
  categoria: string
  cotasOptIn: string[]
  campos: Record<string, unknown>
  setSubmitting: (v: boolean) => void
  setError: (v: string) => void
}

// Submissão final da inscrição: salva os campos mais recentes e envia para avaliação.
export function useInscricaoApiSubmit({
  inscricaoId,
  categoria,
  cotasOptIn,
  campos,
  setSubmitting,
  setError,
}: UseInscricaoApiSubmitParams) {
  const router = useRouter()

  const handleSubmit = useCallback(async () => {
    if (!inscricaoId) return
    setSubmitting(true)
    setError('')

    try {
      // Salvar campos antes de submeter
      await fetch(`/api/proponente/inscricoes/${inscricaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos, categoria: categoria || undefined, cotasOptIn }),
      })

      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/submit`, {
        method: 'POST',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar inscrição')

      router.push(`/proponente/inscricoes/${inscricaoId}?enviada=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar inscrição')
    } finally {
      setSubmitting(false)
    }
  }, [inscricaoId, campos, categoria, cotasOptIn, router, setSubmitting, setError])

  return { handleSubmit }
}
