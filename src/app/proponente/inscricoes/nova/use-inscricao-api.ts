'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { Anexo } from '@/types/anexo'
import { useInscricaoApiRascunho } from './use-inscricao-api-rascunho'
import { useInscricaoApiAnexos } from './use-inscricao-api-anexos'
import { useInscricaoApiSubmit } from './use-inscricao-api-submit'

interface UseInscricaoApiParams {
  editalId: string
  inscricaoId: string
  setInscricaoId: (id: string) => void
  categoria: string
  cotasOptIn: string[]
  campos: Record<string, unknown>
  setAnexos: Dispatch<SetStateAction<Anexo[]>>
  setSaving: (v: boolean) => void
  setSubmitting: (v: boolean) => void
  setUploading: (v: boolean) => void
  setError: (v: string) => void
  setSuccess: (v: string) => void
}

// Compõe as chamadas de API do fluxo de inscrição (rascunho, anexos e submissão)
// num único objeto de handlers para o hook orquestrador (use-inscricao-form).
export function useInscricaoApi({
  editalId,
  inscricaoId,
  setInscricaoId,
  categoria,
  cotasOptIn,
  campos,
  setAnexos,
  setSaving,
  setSubmitting,
  setUploading,
  setError,
  setSuccess,
}: UseInscricaoApiParams) {
  const { createInscricao, saveRascunho } = useInscricaoApiRascunho({
    editalId,
    inscricaoId,
    setInscricaoId,
    categoria,
    cotasOptIn,
    campos,
    setSaving,
    setError,
    setSuccess,
  })

  const { handleUpload, handleAttachVideoLink, handleDeleteAnexo } = useInscricaoApiAnexos({
    inscricaoId,
    createInscricao,
    setAnexos,
    setUploading,
    setError,
  })

  const { handleSubmit } = useInscricaoApiSubmit({
    inscricaoId,
    categoria,
    cotasOptIn,
    campos,
    setSubmitting,
    setError,
  })

  return {
    createInscricao,
    saveRascunho,
    handleUpload,
    handleAttachVideoLink,
    handleDeleteAnexo,
    handleSubmit,
  }
}
