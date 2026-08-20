'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { TipoProponente } from '@prisma/client'
import type { Anexo } from '@/types/anexo'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { CategoriaConfig } from '@/types/categoria-config'
import { parseAuxilioInscricao, AUXILIO_INSCRICAO_CAMPO } from '@/types/auxilio-inscricao'
import { EDITAL_SLUG_MESTRES_E_MESTRAS } from '@/lib/constants/editais-especiais'
import { useInscricaoForm } from './use-inscricao-form'
import { StepIndicator } from './step-indicator'
import { StepTransition } from './step-transition'
import { StepCategoria } from './step-categoria'
import { StepDados } from './step-dados'
import { StepEtapaCustom } from './step-etapa-custom'
import { StepAnexos } from './step-anexos'
import { StepRevisao } from './step-revisao'
import { VideoStep } from './video-step'
import { FormNavigation } from './form-navigation'
import { TourButton } from '../../tour-button'
import { montarPassosNovaInscricao } from './nova-tour-steps'

type TipoAnexoEdital = import('@/lib/constants/attachment-types').TipoAnexo

interface ArquivoEditalDownload {
  id: string
  tipo: string
  titulo: string
  url: string
  acessivel: boolean
}

interface EditalInfo {
  id: string
  slug?: string
  titulo: string
  categorias: string[]
  categoriasConfig?: CategoriaConfig[] | null
  camposFormulario: CampoFormulario[]
  tiposAnexo?: TipoAnexoEdital[] | null
  etapasCustomizadas?: EtapaCustomizada[]
  arquivos?: ArquivoEditalDownload[]
  tipoLabels?: Record<string, string>
  videoHabilitado?: boolean
}

interface InscricaoFormProps {
  edital: EditalInfo
  tipoProponente?: TipoProponente | null
  // Dados existentes para edição de rascunho
  inscricaoId?: string
  initialCategoria?: string
  initialCotasOptIn?: string[]
  initialCampos?: Record<string, unknown>
  initialAnexos?: Anexo[]
}

export default function InscricaoForm({
  edital,
  tipoProponente,
  inscricaoId: existingId,
  initialCategoria = '',
  initialCotasOptIn = [],
  initialCampos = {},
  initialAnexos = [],
}: InscricaoFormProps) {
  const f = useInscricaoForm({
    edital,
    tipoProponente,
    inscricaoId: existingId,
    initialCategoria,
    initialCotasOptIn,
    initialCampos,
    initialAnexos,
  })

  const mostrarAuxilioInscricao = edital.slug === EDITAL_SLUG_MESTRES_E_MESTRAS
  const auxilioInscricao = parseAuxilioInscricao(f.campos[AUXILIO_INSCRICAO_CAMPO])

  // Direção da transição entre etapas — compara com a etapa anterior pra
  // deslizar o conteúdo da direita (avançando) ou da esquerda (voltando).
  const etapaAnteriorRef = useRef(f.currentStep)
  const direction = f.currentStep >= etapaAnteriorRef.current ? 1 : -1
  useEffect(() => {
    etapaAnteriorRef.current = f.currentStep
  }, [f.currentStep])

  // Refeito a cada troca de etapa — o tour explica de verdade o que está na
  // tela agora, não uma introdução genérica do wizard inteiro.
  const passosTour = useMemo(
    () => montarPassosNovaInscricao(f.step, {
      currentStep: f.currentStep,
      totalSteps: f.steps.length,
      temCotas: (f.categoriaConfig?.cotas?.length ?? 0) > 0,
    }),
    [f.step, f.currentStep, f.steps.length, f.categoriaConfig],
  )

  return (
    <div className="space-y-6">
      <TourButton passos={passosTour} />

      <StepIndicator steps={f.steps} currentStep={f.currentStep} onStepClick={f.setCurrentStep} />

      {f.error && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700" role="alert">
          <span className="font-medium text-red-700">Erro. </span>
          {f.error}
        </div>
      )}
      {f.success && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700" role="status">
          <span className="font-medium text-brand-700">Sucesso. </span>
          {f.success}
        </div>
      )}

      <div id="tour-nova-conteudo">
        <StepTransition stepKey={f.currentStep} direction={direction}>
          <>
            {f.step.kind === 'categoria' && (
              <StepCategoria
                categorias={edital.categorias}
                categoria={f.categoria}
                onCategoriaChange={f.handleCategoriaChange}
                categoriaConfig={f.categoriaConfig}
                cotasOptIn={f.cotasOptIn}
                onToggleCota={f.toggleCota}
                mostrarAuxilioInscricao={mostrarAuxilioInscricao}
                auxilioInscricao={auxilioInscricao}
                onAuxilioInscricaoChange={(v) => f.updateCampo(AUXILIO_INSCRICAO_CAMPO, v)}
              />
            )}

            {f.step.kind === 'dados' && (
              <StepDados campos={f.camposFormulario} values={f.campos} onChange={f.updateCampo} />
            )}

            {f.step.kind === 'video' && (
              <VideoStep
                etapasCustomizadas={f.etapasCustomizadas}
                anexoVideo={f.anexoVideoSubstitutivo}
                uploading={f.uploading}
                onUploadFile={f.handleUpload}
                onAttachLink={f.handleAttachVideoLink}
                onRemove={f.handleDeleteAnexo}
              />
            )}

            {f.step.kind === 'etapa_custom' && (
              <StepEtapaCustom etapa={f.step.etapa} values={f.campos} onChange={f.updateCampo} />
            )}

            {f.step.kind === 'anexos' && (
              <StepAnexos
                arquivosEdital={edital.arquivos}
                tipoLabels={edital.tipoLabels}
                tiposAnexo={f.effectiveTiposAnexo}
                tiposAnexoEdital={edital.tiposAnexo}
                anexos={f.anexos}
                uploading={f.uploading}
                onUpload={f.handleUpload}
                videoHabilitado={edital.videoHabilitado}
                submissaoPorVideo={f.submissaoPorVideo}
                anexoVideoComplementar={f.anexoVideoComplementar}
                onAttachVideoLink={f.handleAttachVideoLink}
                onRemoveAnexo={f.handleDeleteAnexo}
              />
            )}

            {f.step.kind === 'revisao' && (
              <StepRevisao
                hasCategorias={f.hasCategorias}
                categoria={f.categoria}
                categoriaConfig={f.categoriaConfig}
                cotasOptIn={f.cotasOptIn}
                camposFormulario={f.camposFormulario}
                etapasCustomizadas={f.etapasCustomizadas}
                values={f.campos}
                submissaoPorVideo={f.submissaoPorVideo}
                anexoVideoSubstitutivo={f.anexoVideoSubstitutivo}
                anexos={f.anexos}
                tiposAnexoEdital={edital.tiposAnexo}
              />
            )}
          </>
        </StepTransition>
      </div>

      <FormNavigation
        step={f.step}
        currentStep={f.currentStep}
        onPrev={f.goPrev}
        onNext={f.goNext}
        onSaveRascunho={f.saveRascunho}
        onSubmit={f.handleSubmit}
        saving={f.saving}
        submitting={f.submitting}
        podeAvancarDeAnexos={f.podeAvancarDeAnexos}
        anexosObrigatoriosFaltandoLabels={f.anexosObrigatoriosFaltando.map((t) => t.label)}
      />
    </div>
  )
}
