'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseInscricaoApiRascunhoParams {
  editalId: string
  inscricaoId: string
  setInscricaoId: (id: string) => void
  categoria: string
  cotasOptIn: string[]
  campos: Record<string, unknown>
  setSaving: (v: boolean) => void
  setError: (v: string) => void
  setSuccess: (v: string) => void
}

// Criação e salvamento do rascunho da inscrição — base para as demais chamadas
// (upload de anexos e submissão dependem de `createInscricao` já existir).
export function useInscricaoApiRascunho({
  editalId,
  inscricaoId,
  setInscricaoId,
  categoria,
  cotasOptIn,
  campos,
  setSaving,
  setError,
  setSuccess,
}: UseInscricaoApiRascunhoParams) {
  const router = useRouter()

  const createInscricao = useCallback(async () => {
    if (inscricaoId) return inscricaoId

    const res = await fetch('/api/proponente/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editalId,
        categoria: categoria || undefined,
        cotasOptIn,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 409 && data.inscricaoId) {
        // Já tem inscrição — redirecionar para edição
        router.push(`/proponente/inscricoes/${data.inscricaoId}/editar`)
        return ''
      }
      throw new Error(data.message || 'Erro ao criar inscrição')
    }

    setInscricaoId(data.id)
    return data.id as string
  }, [inscricaoId, editalId, categoria, cotasOptIn, router, setInscricaoId])

  const saveRascunho = useCallback(async () => {
    setSaving(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return

      const res = await fetch(`/api/proponente/inscricoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos, categoria: categoria || undefined, cotasOptIn }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erro ao salvar')
      }

      setSuccess('Rascunho salvo!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar rascunho')
    } finally {
      setSaving(false)
    }
  }, [createInscricao, campos, categoria, cotasOptIn, setSaving, setError, setSuccess])

  return { createInscricao, saveRascunho }
}
