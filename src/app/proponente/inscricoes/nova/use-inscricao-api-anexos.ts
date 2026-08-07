'use client'

import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { Anexo } from '@/types/anexo'

interface UseInscricaoApiAnexosParams {
  inscricaoId: string
  createInscricao: () => Promise<string>
  setAnexos: Dispatch<SetStateAction<Anexo[]>>
  setUploading: (v: boolean) => void
  setError: (v: string) => void
}

// Envio de anexo (arquivo), anexação de vídeo por link e remoção de anexo.
// Upload e link reaproveitam `createInscricao` — a inscrição-rascunho é criada
// sob demanda no primeiro anexo, se ainda não existir.
export function useInscricaoApiAnexos({
  inscricaoId,
  createInscricao,
  setAnexos,
  setUploading,
  setError,
}: UseInscricaoApiAnexosParams) {
  const handleUpload = useCallback(async (file: File, tipo: string, titulo: string): Promise<boolean> => {
    setUploading(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return false

      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', tipo)
      formData.append('titulo', titulo)

      const res = await fetch(`/api/proponente/inscricoes/${id}/anexos`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro no upload')

      setAnexos((prev) => [...prev, data.data])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
      return false
    } finally {
      setUploading(false)
    }
  }, [createInscricao, setAnexos, setUploading, setError])

  const handleAttachVideoLink = useCallback(async (url: string, tipo: string, titulo: string): Promise<boolean> => {
    setUploading(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return false

      const formData = new FormData()
      formData.append('url', url)
      formData.append('tipo', tipo)
      formData.append('titulo', titulo)

      const res = await fetch(`/api/proponente/inscricoes/${id}/anexos`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao anexar link')

      setAnexos((prev) => [...prev, data.data])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao anexar link')
      return false
    } finally {
      setUploading(false)
    }
  }, [createInscricao, setAnexos, setUploading, setError])

  const handleDeleteAnexo = useCallback(async (anexoId: string) => {
    if (!inscricaoId) return
    setError('')

    try {
      const res = await fetch(`/api/proponente/inscricoes/${inscricaoId}/anexos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anexoId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erro ao remover')
      }

      setAnexos((prev) => prev.filter((a) => a.id !== anexoId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover anexo')
    }
  }, [inscricaoId, setAnexos, setError])

  return { handleUpload, handleAttachVideoLink, handleDeleteAnexo }
}
