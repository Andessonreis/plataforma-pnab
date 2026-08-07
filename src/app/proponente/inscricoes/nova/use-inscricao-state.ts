'use client'

import { useState } from 'react'
import type { Anexo } from '@/types/anexo'
import type { CategoriaConfig } from '@/types/categoria-config'

interface UseInscricaoStateParams {
  existingId?: string
  initialCategoria: string
  initialCotasOptIn: string[]
  initialCampos: Record<string, unknown>
  initialAnexos: Anexo[]
  categoriasConfig?: CategoriaConfig[] | null
}

// Estado bruto do formulário de inscrição: identificação, categoria/cotas, campos dinâmicos,
// anexos e flags de UI (loading/mensagens). Isolado do fluxo de etapas e das chamadas de API.
export function useInscricaoState({
  existingId,
  initialCategoria,
  initialCotasOptIn,
  initialCampos,
  initialAnexos,
  categoriasConfig,
}: UseInscricaoStateParams) {
  const [currentStep, setCurrentStep] = useState(0)
  const [inscricaoId, setInscricaoId] = useState(existingId || '')
  const [categoria, setCategoria] = useState(initialCategoria)
  const [cotasOptIn, setCotasOptIn] = useState<string[]>(initialCotasOptIn)
  const [campos, setCampos] = useState<Record<string, unknown>>(initialCampos)
  const [anexos, setAnexos] = useState<Anexo[]>(initialAnexos)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const categoriaConfig = categoriasConfig?.find((c) => c.nome === categoria)

  function handleCategoriaChange(novaCategoria: string) {
    setCategoria(novaCategoria)
    // Cotas só fazem sentido pra categoria escolhida — limpa ao trocar
    setCotasOptIn([])
  }

  function toggleCota(key: string) {
    setCotasOptIn((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  function updateCampo(nome: string, valor: unknown) {
    setCampos((prev) => ({ ...prev, [nome]: valor }))
  }

  return {
    currentStep, setCurrentStep,
    inscricaoId, setInscricaoId,
    categoria, setCategoria,
    cotasOptIn, setCotasOptIn,
    categoriaConfig,
    handleCategoriaChange,
    toggleCota,
    campos, setCampos,
    updateCampo,
    anexos, setAnexos,
    saving, setSaving,
    submitting, setSubmitting,
    uploading, setUploading,
    error, setError,
    success, setSuccess,
  }
}
