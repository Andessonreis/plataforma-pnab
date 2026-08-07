'use client'

import { filterCamposByTipo } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { TipoProponente } from '@prisma/client'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { Anexo } from '@/types/anexo'
import type { Step } from './types'

interface UseInscricaoStepsParams {
  hasCategorias: boolean
  videoHabilitado?: boolean
  etapasCustomizadasRaw: EtapaCustomizada[]
  tipoProponente?: TipoProponente | null
  submissaoPorVideo: boolean
  anexos: Anexo[]
  effectiveTiposAnexo: TipoAnexo[]
  currentStep: number
  setCurrentStep: (i: number) => void
  saveRascunho: () => Promise<void>
  setError: (v: string) => void
}

// Monta a lista de etapas do wizard e a navegação entre elas — vídeo entra logo
// após "dados"; etapas customizadas só aparecem se o proponente não optou por
// substituí-las por um vídeo único.
export function useInscricaoSteps({
  hasCategorias,
  videoHabilitado,
  etapasCustomizadasRaw,
  tipoProponente,
  submissaoPorVideo,
  anexos,
  effectiveTiposAnexo,
  currentStep,
  setCurrentStep,
  saveRascunho,
  setError,
}: UseInscricaoStepsParams) {
  const etapasCustomizadas: EtapaCustomizada[] = etapasCustomizadasRaw
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((e) => ({ ...e, campos: filterCamposByTipo(e.campos, tipoProponente) }))
    .filter((e) => e.campos.length > 0)

  const steps: Step[] = [
    ...(hasCategorias ? [{ kind: 'categoria' as const }] : []),
    { kind: 'dados' as const },
    ...(videoHabilitado ? [{ kind: 'video' as const }] : []),
    ...(submissaoPorVideo ? [] : etapasCustomizadas.map((etapa) => ({ kind: 'etapa_custom' as const, etapa }))),
    { kind: 'anexos' as const },
    { kind: 'revisao' as const },
  ]

  const step = steps[currentStep]

  // Anexos obrigatórios faltando — usado para bloquear avanço da etapa "anexos"
  // e desabilitar o botão "Próximo" quando não estiverem todos enviados.
  const anexosObrigatoriosFaltando = effectiveTiposAnexo
    .filter((t) => t.obrigatorio)
    .filter((t) => !anexos.some((a) => a.tipo === t.tipo))
  const podeAvancarDeAnexos = anexosObrigatoriosFaltando.length === 0

  const goNext = async () => {
    setError('')
    // Bloquear avanço da etapa "anexos" sem os obrigatórios — evita usuário
    // descobrir só na revisão/submit que o backend vai rejeitar.
    if (step.kind === 'anexos' && !podeAvancarDeAnexos) {
      setError(
        `Envie os anexos obrigatórios antes de prosseguir: ${anexosObrigatoriosFaltando
          .map((t) => t.label)
          .join(', ')}`,
      )
      return
    }
    // Ao sair de etapas com campos (categoria, dados, customizadas), salvar rascunho
    if (step.kind === 'categoria' || step.kind === 'dados' || step.kind === 'etapa_custom') {
      await saveRascunho()
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return {
    etapasCustomizadas,
    steps,
    step,
    anexosObrigatoriosFaltando,
    podeAvancarDeAnexos,
    goNext,
    goPrev,
  }
}
