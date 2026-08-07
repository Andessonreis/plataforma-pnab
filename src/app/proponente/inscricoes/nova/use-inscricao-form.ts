'use client'

import { filterCamposByTipo, type CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { TipoProponente } from '@prisma/client'
import { PNAB_DEFAULT_ATTACHMENT_TYPES } from '@/lib/constants/attachment-types'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import { VIDEO_ANEXO_TIPOS } from '@/lib/upload/anexo-config'
import type { Anexo } from '@/types/anexo'
import type { CategoriaConfig } from '@/types/categoria-config'
import { useInscricaoState } from './use-inscricao-state'
import { useInscricaoApi } from './use-inscricao-api'
import { useInscricaoSteps } from './use-inscricao-steps'

interface EditalFormParams {
  id: string
  categorias: string[]
  categoriasConfig?: CategoriaConfig[] | null
  camposFormulario: CampoFormulario[]
  tiposAnexo?: TipoAnexo[] | null
  etapasCustomizadas?: EtapaCustomizada[]
  videoHabilitado?: boolean
}

interface UseInscricaoFormParams {
  edital: EditalFormParams
  tipoProponente?: TipoProponente | null
  inscricaoId?: string
  initialCategoria: string
  initialCotasOptIn: string[]
  initialCampos: Record<string, unknown>
  initialAnexos: Anexo[]
}

// Hook orquestrador do wizard de inscrição: combina estado bruto, chamadas de API
// e navegação entre etapas num único ponto de consumo para o componente de página.
export function useInscricaoForm({
  edital,
  tipoProponente,
  inscricaoId: existingId,
  initialCategoria,
  initialCotasOptIn,
  initialCampos,
  initialAnexos,
}: UseInscricaoFormParams) {
  const hasCategorias = edital.categorias.length > 0
  const camposFormulario = filterCamposByTipo(edital.camposFormulario || [], tipoProponente)
  const effectiveTiposAnexo = edital.tiposAnexo?.length ? edital.tiposAnexo : PNAB_DEFAULT_ATTACHMENT_TYPES

  const state = useInscricaoState({
    existingId,
    initialCategoria,
    initialCotasOptIn,
    initialCampos,
    initialAnexos,
    categoriasConfig: edital.categoriasConfig,
  })

  const api = useInscricaoApi({
    editalId: edital.id,
    inscricaoId: state.inscricaoId,
    setInscricaoId: state.setInscricaoId,
    categoria: state.categoria,
    cotasOptIn: state.cotasOptIn,
    campos: state.campos,
    setAnexos: state.setAnexos,
    setSaving: state.setSaving,
    setSubmitting: state.setSubmitting,
    setUploading: state.setUploading,
    setError: state.setError,
    setSuccess: state.setSuccess,
  })

  // Vídeo substitutivo já anexado (se houver) — dispensa o preenchimento das etapas customizadas
  const anexoVideoSubstitutivo = state.anexos.find((a) => a.tipo === VIDEO_ANEXO_TIPOS.substitutivo) ?? null
  const submissaoPorVideo = !!anexoVideoSubstitutivo
  // Vídeo complementar (opcional) — só relevante quando o proponente preencheu manualmente
  const anexoVideoComplementar = state.anexos.find((a) => a.tipo === VIDEO_ANEXO_TIPOS.complementar) ?? null

  const steps = useInscricaoSteps({
    hasCategorias,
    videoHabilitado: edital.videoHabilitado,
    etapasCustomizadasRaw: edital.etapasCustomizadas ?? [],
    tipoProponente,
    submissaoPorVideo,
    anexos: state.anexos,
    effectiveTiposAnexo,
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
    saveRascunho: api.saveRascunho,
    setError: state.setError,
  })

  return {
    hasCategorias,
    camposFormulario,
    effectiveTiposAnexo,
    ...state,
    ...api,
    ...steps,
    anexoVideoSubstitutivo,
    submissaoPorVideo,
    anexoVideoComplementar,
  }
}
