'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, Textarea, Card, Badge, CurrencyInput, formatCurrencyBRL } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { IconArrowLeft, IconArrowRight, IconCheck, IconDocument, IconDownload, IconAccessible } from '@/components/ui/icons'
import { getBadgeVariantForTipo } from '@/lib/utils/badge-variant'
import { resolveCharLimits } from '@/lib/campo-limits'
import { filterCamposByTipo, type CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { TipoProponente } from '@prisma/client'
import { PNAB_DEFAULT_ATTACHMENT_TYPES } from '@/lib/constants/attachment-types'
import { VIDEO_ANEXO_TIPOS } from '@/lib/upload/anexo-config'
import type { Anexo } from '@/types/anexo'
import {
  BlocoInfo,
  TabelaInput,
  GrupoRepetivelInput,
  CampoEstruturaRevisao,
} from './campo-estrutura'
import { AnexoUpload } from './anexo-upload'
import { VideoAttach } from './video-attach'
import { VideoStep } from './video-step'

// ─── Contador de caracteres ──────────────────────────────────────────────────

function CharCounter({ current, max, min }: { current: number; max: number; min?: number }) {
  const remaining = max - current
  const isTooLong = remaining < 0
  const isNearLimit = remaining >= 0 && remaining <= Math.ceil(max * 0.1)
  const isTooShort = min != null && min > 0 && current > 0 && current < min

  return (
    <div className="flex justify-between mt-1 text-xs" aria-live="polite">
      {isTooShort ? (
        <span className="text-amber-600">
          Mínimo de {min} caracteres ({min! - current} restantes)
        </span>
      ) : <span />}
      <span
        className={
          isTooLong ? 'text-red-600 font-medium' :
          isNearLimit ? 'text-amber-600' :
          'text-slate-400'
        }
      >
        {current}/{max}
      </span>
    </div>
  )
}

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
  titulo: string
  categorias: string[]
  categoriasConfig?: import('@/types/categoria-config').CategoriaConfig[] | null
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

type Step =
  | { kind: 'categoria' }
  | { kind: 'dados' }
  | { kind: 'video' }
  | { kind: 'etapa_custom'; etapa: EtapaCustomizada }
  | { kind: 'anexos' }
  | { kind: 'revisao' }

// ─── Componente ──────────────────────────────────────────────────────────────

export default function InscricaoForm({
  edital,
  tipoProponente,
  inscricaoId: existingId,
  initialCategoria = '',
  initialCotasOptIn = [],
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

  const [currentStep, setCurrentStep] = useState(0)
  const [inscricaoId, setInscricaoId] = useState(existingId || '')
  const [categoria, setCategoria] = useState(initialCategoria)
  const [cotasOptIn, setCotasOptIn] = useState<string[]>(initialCotasOptIn)
  const categoriaConfig = edital.categoriasConfig?.find((c) => c.nome === categoria)

  function handleCategoriaChange(novaCategoria: string) {
    setCategoria(novaCategoria)
    // Cotas só fazem sentido pra categoria escolhida — limpa ao trocar
    setCotasOptIn([])
  }

  function toggleCota(key: string) {
    setCotasOptIn((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }
  const [campos, setCampos] = useState<Record<string, unknown>>(initialCampos)
  const [anexos, setAnexos] = useState<Anexo[]>(initialAnexos)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Vídeo substitutivo já anexado (se houver) — dispensa o preenchimento das etapas customizadas
  const anexoVideoSubstitutivo = anexos.find((a) => a.tipo === VIDEO_ANEXO_TIPOS.substitutivo) ?? null
  const submissaoPorVideo = !!anexoVideoSubstitutivo
  // Vídeo complementar (opcional) — só relevante quando o proponente preencheu manualmente
  const anexoVideoComplementar = anexos.find((a) => a.tipo === VIDEO_ANEXO_TIPOS.complementar) ?? null

  // Determinar etapas — vídeo entra logo após "dados"; customizadas só aparecem
  // se o proponente não optou por substituí-las por um vídeo único.
  const steps: Step[] = [
    ...(hasCategorias ? [{ kind: 'categoria' as const }] : []),
    { kind: 'dados' as const },
    ...(edital.videoHabilitado ? [{ kind: 'video' as const }] : []),
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

  // ─── Criar inscrição (rascunho) ────────────────────────────────────────────

  const createInscricao = useCallback(async () => {
    if (inscricaoId) return inscricaoId

    const res = await fetch('/api/proponente/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editalId: edital.id,
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
  }, [inscricaoId, edital.id, categoria, cotasOptIn, router])

  // ─── Salvar rascunho ──────────────────────────────────────────────────────

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
  }, [createInscricao, campos, categoria, cotasOptIn])

  // ─── Upload de anexo ──────────────────────────────────────────────────────

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
  }, [createInscricao])

  // ─── Anexar vídeo por link (Drive/YouTube/etc., sem upload de arquivo) ─────

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
  }, [createInscricao])

  // ─── Remover anexo ────────────────────────────────────────────────────────

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
  }, [inscricaoId])

  // ─── Submeter ─────────────────────────────────────────────────────────────

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
  }, [inscricaoId, campos, categoria, cotasOptIn, router])

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

  // ─── Renderizar campo dinâmico ────────────────────────────────────────────

  const renderCampo = (campo: CampoFormulario) => {
    // Elementos estruturais — tratados antes do switch por tipo simples
    if (campo.tipo === 'info') {
      return <BlocoInfo key={campo.nome || `info_${campo.label}`} campo={campo} />
    }
    if (campo.tipo === 'tabela') {
      const valor = Array.isArray(campos[campo.nome]) ? campos[campo.nome] as Record<string, unknown>[] : []
      return (
        <TabelaInput
          key={campo.nome}
          campo={campo}
          value={valor}
          onChange={(v) => updateCampo(campo.nome, v)}
        />
      )
    }
    if (campo.tipo === 'grupo_repetivel') {
      const valor = Array.isArray(campos[campo.nome]) ? campos[campo.nome] as Record<string, unknown>[] : []
      return (
        <GrupoRepetivelInput
          key={campo.nome}
          campo={campo}
          value={valor}
          onChange={(v) => updateCampo(campo.nome, v)}
        />
      )
    }

    const value = (campos[campo.nome] as string) ?? ''

    switch (campo.tipo) {
      case 'texto':
      case 'text': {
        const limits = resolveCharLimits(campo)
        return (
          <div key={campo.nome}>
            <Input
              label={campo.label}
              value={value}
              onChange={(e) => updateCampo(campo.nome, e.target.value)}
              placeholder={campo.placeholder}
              required={campo.obrigatorio}
              hint={campo.hint}
              maxLength={limits?.maxLength}
            />
            {limits && (
              <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
            )}
          </div>
        )
      }
      case 'textarea': {
        const limits = resolveCharLimits(campo)
        return (
          <div key={campo.nome}>
            <Textarea
              label={campo.label}
              value={value}
              onChange={(e) => updateCampo(campo.nome, e.target.value)}
              placeholder={campo.placeholder}
              required={campo.obrigatorio}
              hint={campo.hint}
              maxLength={limits?.maxLength}
            />
            {limits && (
              <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
            )}
          </div>
        )
      }
      case 'select':
        return (
          <Select
            key={campo.nome}
            label={campo.label}
            value={value}
            onChange={(e) => updateCampo(campo.nome, e.target.value)}
            options={(campo.opcoes || []).map((op): SelectOption => ({ value: op, label: op }))}
            placeholder="Selecione..."
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      case 'moeda':
      case 'currency':
        return (
          <CurrencyInput
            key={campo.nome}
            label={campo.label}
            value={value}
            onChange={(rawValue) => updateCampo(campo.nome, rawValue)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      case 'numero':
      case 'number': {
        // Campos cujo nome sugere valor monetário recebem máscara BRL automaticamente
        const isCurrency = /valor|preco|preço|custo|orcamento|orçamento/i.test(campo.nome)
        if (isCurrency) {
          return (
            <CurrencyInput
              key={campo.nome}
              label={campo.label}
              value={value}
              onChange={(rawValue) => updateCampo(campo.nome, rawValue)}
              placeholder={campo.placeholder}
              required={campo.obrigatorio}
              hint={campo.hint}
            />
          )
        }
        const limits = resolveCharLimits(campo)
        return (
          <div key={campo.nome}>
            <Input
              label={campo.label}
              type="number"
              min={0}
              value={value}
              onChange={(e) => {
                const v = e.target.value
                // Rejeita números negativos: input "type=number" aceita "-" por padrão
                if (v === '' || Number(v) >= 0) updateCampo(campo.nome, v)
              }}
              placeholder={campo.placeholder}
              required={campo.obrigatorio}
              hint={campo.hint}
            />
            {limits && (
              <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
            )}
          </div>
        )
      }
      case 'data':
      case 'date':
        return (
          <Input
            key={campo.nome}
            label={campo.label}
            type="date"
            value={value}
            onChange={(e) => updateCampo(campo.nome, e.target.value)}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      case 'multiselect': {
        const selected = Array.isArray(campos[campo.nome]) ? campos[campo.nome] as string[] : []
        return (
          <div key={campo.nome}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {campo.label}
              {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}
            <div className="space-y-2">
              {(campo.opcoes || []).map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(op)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, op]
                        : selected.filter((s) => s !== op)
                      updateCampo(campo.nome, next)
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {op}
                </label>
              ))}
            </div>
          </div>
        )
      }
      case 'arquivo':
        // Arquivos são tratados na etapa de anexos
        return null
      default:
        return null
    }
  }

  // Render de campo na tela de revisão (modo leitura)
  const renderCampoRevisao = (campo: CampoFormulario) => {
    // Elementos estruturais têm render próprio
    if (campo.tipo === 'info' || campo.tipo === 'tabela' || campo.tipo === 'grupo_repetivel') {
      return (
        <CampoEstruturaRevisao
          key={campo.nome || `info_${campo.label}`}
          campo={campo}
          value={campos[campo.nome]}
        />
      )
    }

    const valor = campos[campo.nome]
    const isEmpty = valor === undefined || valor === null || valor === '' ||
      (Array.isArray(valor) && valor.length === 0)
    return (
      <div key={campo.nome} className="border-b border-slate-100 pb-3">
        <dt className="text-sm text-slate-500">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </dt>
        <dd className={`text-sm mt-0.5 ${isEmpty ? 'text-red-500 italic' : 'text-slate-900'}`}>
          {isEmpty
            ? 'Não preenchido'
            : (() => {
              if (Array.isArray(valor)) return (valor as string[]).join(', ')
              const isCurrency =
                campo.tipo === 'moeda' ||
                campo.tipo === 'currency' ||
                (/valor|preco|preço|custo|orcamento|orçamento/i.test(campo.nome) &&
                  (campo.tipo === 'numero' || campo.tipo === 'number'))
              return isCurrency ? formatCurrencyBRL(valor as string) : String(valor)
            })()
          }
        </dd>
      </div>
    )
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Indicador de etapas */}
      <nav aria-label="Progresso da inscrição">
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => {
            const label =
              s.kind === 'categoria' ? 'Categoria' :
              s.kind === 'dados' ? 'Dados do Projeto' :
              s.kind === 'video' ? 'Vídeo' :
              s.kind === 'etapa_custom' ? s.etapa.titulo :
              s.kind === 'anexos' ? 'Anexos' :
              'Revisão'
            const key = s.kind === 'etapa_custom' ? `custom:${s.etapa.id}` : s.kind
            const isActive = i === currentStep
            const isCompleted = i < currentStep

            return (
              <li key={key} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-px w-6 sm:w-10 ${isCompleted ? 'bg-brand-500' : 'bg-slate-200'}`} />
                )}
                <button
                  type="button"
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  disabled={i > currentStep}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                    ${isActive ? 'bg-brand-600 text-white' : ''}
                    ${isCompleted ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-100 text-slate-400' : ''}
                  `}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                    ${isActive ? 'bg-white text-brand-600' : ''}
                    ${isCompleted ? 'bg-brand-600 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
                  `}>
                    {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

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
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Selecione a Categoria</h2>
          <p className="text-sm text-slate-500 mb-6">
            Escolha a categoria em que seu projeto se enquadra neste edital.
          </p>
          <Select
            label="Categoria"
            value={categoria}
            onChange={(e) => handleCategoriaChange(e.target.value)}
            options={edital.categorias.map((cat): SelectOption => ({ value: cat, label: cat }))}
            placeholder="Selecione a categoria..."
            required
          />

          {categoriaConfig && categoriaConfig.cotas.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-medium text-slate-900">Deseja concorrer às cotas?</h3>
              <p className="text-sm text-slate-500 mt-1 mb-3">
                Opcional. Ao marcar, você concorrerá simultaneamente às vagas de ampla concorrência e à(s) cota(s)
                escolhida(s), e deverá enviar a autodeclaração correspondente na etapa de anexos.
              </p>
              <div className="space-y-2">
                {categoriaConfig.cotas.map((cota) => (
                  <label key={cota.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={cotasOptIn.includes(cota.key)}
                      onChange={() => toggleCota(cota.key)}
                    />
                    {cota.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── Etapa: Dados do Projeto ───────────────────────────────────────── */}
      {step.kind === 'dados' && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Dados do Projeto</h2>
          <p className="text-sm text-slate-500 mb-6">
            Preencha os dados da sua proposta. Campos marcados com * são obrigatórios.
          </p>
          <div className="space-y-5">
            {camposFormulario
              .filter((c) => c.tipo !== 'arquivo')
              .map(renderCampo)}
            {camposFormulario.filter((c) => c.tipo !== 'arquivo').length === 0 && (
              <p className="text-slate-500 text-sm">
                Nenhum campo configurado para este edital.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ─── Etapa: Vídeo (opcional, só quando o edital libera) ────────────── */}
      {step.kind === 'video' && (
        <VideoStep
          etapasCustomizadas={etapasCustomizadas}
          anexoVideo={anexoVideoSubstitutivo}
          uploading={uploading}
          onUploadFile={handleUpload}
          onAttachLink={handleAttachVideoLink}
          onRemove={handleDeleteAnexo}
        />
      )}

      {/* ─── Etapa: customizada (definida pelo admin no edital) ────────────── */}
      {step.kind === 'etapa_custom' && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{step.etapa.titulo}</h2>
          {step.etapa.descricao && (
            <p className="text-sm text-slate-500 mb-6 whitespace-pre-line">{step.etapa.descricao}</p>
          )}
          {!step.etapa.descricao && (
            <p className="text-sm text-slate-500 mb-6">
              Preencha as informações abaixo. Campos marcados com * são obrigatórios.
            </p>
          )}
          <div className="space-y-5">
            {step.etapa.campos.filter((c) => c.tipo !== 'arquivo').map(renderCampo)}
            {step.etapa.campos.filter((c) => c.tipo !== 'arquivo').length === 0 && (
              <p className="text-slate-500 text-sm">Nenhum campo configurado nesta etapa.</p>
            )}
          </div>
        </Card>
      )}

      {/* ─── Etapa: Anexos ─────────────────────────────────────────────────── */}
      {step.kind === 'anexos' && (() => {
        const tiposObrigatorios = effectiveTiposAnexo.filter((t) => t.obrigatorio)
        const totalObrigatorios = tiposObrigatorios.length
        const obrigatoriosEnviados = tiposObrigatorios.filter((t) =>
          anexos.some((a) => a.tipo === t.tipo),
        ).length
        const allObrigatoriosOk = obrigatoriosEnviados === totalObrigatorios

        // Conta quantos arquivos por tipo
        const countByTipo = anexos.reduce<Record<string, number>>((acc, a) => {
          acc[a.tipo] = (acc[a.tipo] ?? 0) + 1
          return acc
        }, {})

        return (
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Documentos e Anexos</h2>
            <p className="text-sm text-slate-500 mb-6">
              Envie os documentos necessários para sua inscrição. Formatos aceitos: PDF, PNG, JPEG (máx. 10MB cada).
              <span className="block mt-1">Você pode enviar <strong>mais de um arquivo</strong> por item se precisar.</span>
            </p>

            {/* Arquivos do edital para download (modelos, planilhas, declarações etc.) */}
            {edital.arquivos && edital.arquivos.length > 0 && (
              <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <IconDownload className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Arquivos do Edital para Download
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Baixe os modelos e anexos disponibilizados pela Secretaria. Preencha os modelos exigidos e envie o documento preenchido na seção abaixo.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2" role="list">
                  {edital.arquivos.map((arquivo) => (
                    <li key={arquivo.id}>
                      <a
                        href={arquivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors group min-h-[44px]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 group-hover:bg-brand-100 shrink-0 transition-colors">
                          <IconDownload className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {arquivo.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant={getBadgeVariantForTipo(arquivo.tipo)} className="text-[10px]">
                              {edital.tipoLabels?.[arquivo.tipo] ?? arquivo.tipo}
                            </Badge>
                            {arquivo.acessivel && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-700 font-medium">
                                <IconAccessible className="h-3 w-3" />
                                Acessível
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-brand-600 shrink-0 hidden sm:inline">
                          Baixar
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist de documentos esperados */}
            {effectiveTiposAnexo.length > 0 && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Documentos necessários
                  </h3>
                  {totalObrigatorios > 0 && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        allObrigatoriosOk
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                      aria-live="polite"
                    >
                      {obrigatoriosEnviados}/{totalObrigatorios} obrigatórios enviados
                    </span>
                  )}
                </div>
                <ul className="space-y-2" role="list">
                  {effectiveTiposAnexo.map((t) => {
                    const qtd = countByTipo[t.tipo] ?? 0
                    const enviado = qtd > 0
                    return (
                      <li key={t.tipo} className="flex items-start gap-2 text-sm">
                        {enviado ? (
                          <IconCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={enviado ? 'text-slate-900' : 'text-slate-700'}>
                              {t.label}
                            </span>
                            {t.obrigatorio ? (
                              <span className="text-[10px] uppercase tracking-wide font-semibold text-red-600">
                                obrigatório
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wide font-medium text-slate-400">
                                opcional
                              </span>
                            )}
                            {enviado && (
                              <span className="text-[11px] font-medium text-green-700">
                                {qtd === 1 ? '1 arquivo' : `${qtd} arquivos`}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Upload */}
            <AnexoUpload onUpload={handleUpload} uploading={uploading} tiposAnexoEdital={edital.tiposAnexo} />

            {/* Vídeo complementar opcional — só quando o edital libera vídeo e o proponente não optou pelo vídeo substitutivo */}
            {edital.videoHabilitado && !submissaoPorVideo && (
              <div className="mt-6 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Vídeo complementar (opcional)</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Se quiser, anexe um vídeo complementar à sua inscrição preenchida manualmente.
                </p>
                <VideoAttach
                  tipo={VIDEO_ANEXO_TIPOS.complementar}
                  tituloPadrao="Vídeo complementar"
                  attached={anexoVideoComplementar}
                  uploading={uploading}
                  onUploadFile={handleUpload}
                  onAttachLink={handleAttachVideoLink}
                  onRemove={handleDeleteAnexo}
                />
              </div>
            )}

            {/* Lista de anexos */}
            {anexos.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-slate-700">
                  Anexos enviados ({anexos.length})
                </h3>
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconDocument className="h-5 w-5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
                        <p className="text-xs text-slate-500">{anexo.tipo}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnexo(anexo.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 ml-3 min-h-[44px] px-2"
                      aria-label={`Remover ${anexo.titulo}`}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      {/* ─── Etapa: Revisão ────────────────────────────────────────────────── */}
      {step.kind === 'revisao' && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Revisão da Inscrição</h2>
          <p className="text-sm text-slate-500 mb-6">
            Confira os dados antes de enviar. Após o envio, a inscrição não poderá ser alterada.
          </p>

          <div className="space-y-6">
            {/* Categoria */}
            {hasCategorias && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Categoria</h3>
                <p className="text-slate-900">{categoria || <span className="text-red-500">Não selecionada</span>}</p>
                {cotasOptIn.length > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Concorrendo às cotas:{' '}
                    {cotasOptIn
                      .map((key) => categoriaConfig?.cotas.find((c) => c.key === key)?.label ?? key)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Campos da etapa "Dados" */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Dados do Projeto</h3>
              <dl className="space-y-3">
                {camposFormulario
                  .filter((c) => c.tipo !== 'arquivo')
                  .map(renderCampoRevisao)}
              </dl>
            </div>

            {/* Vídeo da inscrição, se optou por substituir as etapas customizadas */}
            {submissaoPorVideo && anexoVideoSubstitutivo && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Vídeo da inscrição</h3>
                <p className="text-slate-900 text-sm break-all">{anexoVideoSubstitutivo.url}</p>
              </div>
            )}

            {/* Etapas customizadas — omitidas quando a inscrição foi feita por vídeo */}
            {!submissaoPorVideo && etapasCustomizadas.map((etapa) => (
              <div key={etapa.id}>
                <h3 className="text-sm font-medium text-slate-500 mb-3">{etapa.titulo}</h3>
                <dl className="space-y-3">
                  {etapa.campos.filter((c) => c.tipo !== 'arquivo').map(renderCampoRevisao)}
                </dl>
              </div>
            ))}

            {/* Anexos */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">
                Anexos ({anexos.length})
              </h3>
              {anexos.length === 0 ? (
                <p className="text-sm text-red-500 italic">Nenhum anexo enviado</p>
              ) : (
                <ul className="space-y-2">
                  {anexos.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <Badge variant="neutral">{a.tipo}</Badge>
                      {a.titulo}
                    </li>
                  ))}
                </ul>
              )}
              {/* Alerta de anexos obrigatórios faltantes */}
              {(() => {
                const obrigatorios = edital.tiposAnexo?.filter(t => t.obrigatorio) ?? []
                const faltantes = obrigatorios.filter(t =>
                  !anexos.some(a => a.tipo === t.tipo)
                )
                if (faltantes.length === 0) return null
                return (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700" role="alert">
                    <strong>Anexos obrigatórios faltantes:</strong>{' '}
                    {faltantes.map(f => f.label).join(', ')}
                  </div>
                )
              })()}
            </div>
          </div>
        </Card>
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
