'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@client/components/ui'
import { IconArrowLeft, IconArrowRight, IconCheck } from '@client/components/ui/icons'
import { filterCamposByTipo } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { PNAB_DEFAULT_ATTACHMENT_TYPES } from '@/lib/constants/attachment-types'
import { inscricoesClient, InscricaoDuplicadaError } from '@client/api/inscricoes.client'
import type { Anexo, InscricaoFormProps, Step } from './inscricao-form/types'
import { StepIndicator } from './inscricao-form/StepIndicator'
import { EtapaCategoria } from './inscricao-form/steps/EtapaCategoria'
import { EtapaDados } from './inscricao-form/steps/EtapaDados'
import { EtapaCustom } from './inscricao-form/steps/EtapaCustom'
import { EtapaAnexos } from './inscricao-form/steps/EtapaAnexos'
import { EtapaRevisao } from './inscricao-form/steps/EtapaRevisao'

// ─── Componente ──────────────────────────────────────────────────────────────

export default function InscricaoForm({
  edital,
  tipoProponente,
  inscricaoId: existingId,
  initialCategoria = '',
  initialCampos = {},
  initialAnexos = [],
}: InscricaoFormProps) {
  const router = useRouter()
  const hasCategorias = edital.categorias.length > 0
  const camposFormulario = filterCamposByTipo(edital.camposFormulario || [], tipoProponente)
  const effectiveTiposAnexo = edital.tiposAnexo?.length
    ? edital.tiposAnexo
    : PNAB_DEFAULT_ATTACHMENT_TYPES

  // Etapas customizadas ordenadas (filtradas por tipo de proponente em cada campo)
  const etapasCustomizadas: EtapaCustomizada[] = (edital.etapasCustomizadas ?? [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((e) => ({ ...e, campos: filterCamposByTipo(e.campos, tipoProponente) }))
    .filter((e) => e.campos.length > 0)

  // Determinar etapas — customizadas entram entre "dados" e "anexos"
  const steps: Step[] = [
    ...(hasCategorias ? [{ kind: 'categoria' as const }] : []),
    { kind: 'dados' as const },
    ...etapasCustomizadas.map((etapa) => ({ kind: 'etapa_custom' as const, etapa })),
    { kind: 'anexos' as const },
    { kind: 'revisao' as const },
  ]

  const [currentStep, setCurrentStep] = useState(0)
  const [inscricaoId, setInscricaoId] = useState(existingId || '')
  const [categoria, setCategoria] = useState(initialCategoria)
  const [campos, setCampos] = useState<Record<string, unknown>>(initialCampos)
  const [anexos, setAnexos] = useState<Anexo[]>(initialAnexos)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const step = steps[currentStep]

  // Anexos obrigatórios faltando — usado para bloquear avanço da etapa "anexos"
  // e desabilitar o botão "Próximo" quando não estiverem todos enviados.
  const anexosObrigatoriosFaltando = effectiveTiposAnexo
    .filter((t) => t.obrigatorio)
    .filter((t) => !anexos.some((a) => a.tipo === t.tipo))
  const podeAvancarDeAnexos = anexosObrigatoriosFaltando.length === 0

  // ─── Criar inscrição (rascunho) ────────────────────────────────────────────

  const createInscricao = useCallback(async () => {
    if (inscricaoId) return inscricaoId

    try {
      const data = await inscricoesClient.create({
        editalId: edital.id,
        categoria: categoria || undefined,
      })
      setInscricaoId(data.id)
      return data.id
    } catch (err) {
      if (err instanceof InscricaoDuplicadaError) {
        router.push(`/proponente/inscricoes/${err.inscricaoId}/editar`)
        return ''
      }
      throw err
    }
  }, [inscricaoId, edital.id, categoria, router])

  // ─── Salvar rascunho ──────────────────────────────────────────────────────

  const saveRascunho = useCallback(async () => {
    setSaving(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return

      await inscricoesClient.update(id, { campos, categoria: categoria || undefined })

      setSuccess('Rascunho salvo!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar rascunho')
    } finally {
      setSaving(false)
    }
  }, [createInscricao, campos, categoria])

  // ─── Upload de anexo ──────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File, tipo: string, titulo: string): Promise<boolean> => {
    setUploading(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return false

      const anexo = await inscricoesClient.uploadAnexo(id, file, { tipo, titulo })
      setAnexos((prev) => [...prev, anexo])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
      return false
    } finally {
      setUploading(false)
    }
  }, [createInscricao])

  // ─── Remover anexo ────────────────────────────────────────────────────────

  const handleDeleteAnexo = useCallback(async (anexoId: string) => {
    if (!inscricaoId) return
    setError('')

    try {
      await inscricoesClient.removeAnexo(inscricaoId, anexoId)
      setAnexos((prev) => prev.filter((a) => a.id !== anexoId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover anexo')
    }
  }, [inscricaoId])

  // ─── Submeter ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!inscricaoId) return
    setSubmitting(true)
    setError('')

    try {
      // Salvar campos antes de submeter
      await inscricoesClient.update(inscricaoId, { campos, categoria: categoria || undefined })
      await inscricoesClient.submit(inscricaoId)

      router.push(`/proponente/inscricoes/${inscricaoId}?enviada=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar inscrição')
    } finally {
      setSubmitting(false)
    }
  }, [inscricaoId, campos, categoria, router])

  // ─── Navegação entre etapas ───────────────────────────────────────────────

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

  // ─── Atualizar campo ─────────────────────────────────────────────────────

  const updateCampo = (nome: string, valor: unknown) => {
    setCampos((prev) => ({ ...prev, [nome]: valor }))
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Indicador de etapas */}
      <StepIndicator steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Mensagens */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700" role="status">
          {success}
        </div>
      )}

      {/* ─── Etapa: Categoria ──────────────────────────────────────────────── */}
      {step.kind === 'categoria' && (
        <EtapaCategoria
          categorias={edital.categorias}
          categoria={categoria}
          onCategoriaChange={setCategoria}
        />
      )}

      {/* ─── Etapa: Dados do Projeto ───────────────────────────────────────── */}
      {step.kind === 'dados' && (
        <EtapaDados
          campos={camposFormulario}
          valores={campos}
          onCampoChange={updateCampo}
        />
      )}

      {/* ─── Etapa: customizada (definida pelo admin no edital) ────────────── */}
      {step.kind === 'etapa_custom' && (
        <EtapaCustom
          etapa={step.etapa}
          valores={campos}
          onCampoChange={updateCampo}
        />
      )}

      {/* ─── Etapa: Anexos ─────────────────────────────────────────────────── */}
      {step.kind === 'anexos' && (
        <EtapaAnexos
          arquivos={edital.arquivos}
          tipoLabels={edital.tipoLabels}
          effectiveTiposAnexo={effectiveTiposAnexo}
          tiposAnexoEdital={edital.tiposAnexo}
          anexos={anexos}
          onUpload={handleUpload}
          uploading={uploading}
          onDeleteAnexo={handleDeleteAnexo}
        />
      )}

      {/* ─── Etapa: Revisão ────────────────────────────────────────────────── */}
      {step.kind === 'revisao' && (
        <EtapaRevisao
          hasCategorias={hasCategorias}
          categoria={categoria}
          camposFormulario={camposFormulario}
          etapasCustomizadas={etapasCustomizadas}
          valores={campos}
          anexos={anexos}
          tiposAnexoEdital={edital.tiposAnexo}
        />
      )}

      {/* ─── Navegação ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={goPrev} type="button">
              <IconArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          {(step.kind === 'dados' || step.kind === 'categoria' || step.kind === 'etapa_custom') && (
            <Button variant="ghost" onClick={saveRascunho} loading={saving} type="button">
              Salvar rascunho
            </Button>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {step.kind !== 'revisao' ? (
            <>
              <Button
                onClick={goNext}
                type="button"
                disabled={step.kind === 'anexos' && !podeAvancarDeAnexos}
                title={
                  step.kind === 'anexos' && !podeAvancarDeAnexos
                    ? `Faltam anexos obrigatórios: ${anexosObrigatoriosFaltando.map((t) => t.label).join(', ')}`
                    : undefined
                }
              >
                Próximo
                <IconArrowRight className="h-4 w-4 ml-1" />
              </Button>
              {step.kind === 'anexos' && !podeAvancarDeAnexos && (
                <p className="text-xs text-amber-700" aria-live="polite">
                  Envie os anexos obrigatórios para avançar
                </p>
              )}
            </>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} type="button">
              <IconCheck className="h-4 w-4 mr-1" />
              Enviar Inscrição
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
