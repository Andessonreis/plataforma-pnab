'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, Textarea, Card, Badge } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { IconArrowLeft, IconArrowRight, IconCheck, IconDocument } from '@/components/ui/icons'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CampoFormulario {
  nome: string
  label: string
  tipo: 'texto' | 'textarea' | 'select' | 'numero' | 'data' | 'arquivo'
  obrigatorio?: boolean
  placeholder?: string
  opcoes?: string[]
  hint?: string
}

interface Anexo {
  id: string
  tipo: string
  titulo: string
  url: string
  createdAt: string
}

interface EditalInfo {
  id: string
  titulo: string
  categorias: string[]
  camposFormulario: CampoFormulario[]
}

interface InscricaoFormProps {
  edital: EditalInfo
  // Dados existentes para edição de rascunho
  inscricaoId?: string
  initialCategoria?: string
  initialCampos?: Record<string, unknown>
  initialAnexos?: Anexo[]
}

type Step = 'categoria' | 'dados' | 'anexos' | 'revisao'

// ─── Componente ──────────────────────────────────────────────────────────────

export default function InscricaoForm({
  edital,
  inscricaoId: existingId,
  initialCategoria = '',
  initialCampos = {},
  initialAnexos = [],
}: InscricaoFormProps) {
  const router = useRouter()
  const hasCategorias = edital.categorias.length > 0
  const camposFormulario = edital.camposFormulario || []

  // Determinar etapas
  const steps: Step[] = [
    ...(hasCategorias ? ['categoria' as const] : []),
    'dados',
    'anexos',
    'revisao',
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

  // ─── Criar inscrição (rascunho) ────────────────────────────────────────────

  const createInscricao = useCallback(async () => {
    if (inscricaoId) return inscricaoId

    const res = await fetch('/api/proponente/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editalId: edital.id,
        categoria: categoria || undefined,
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
  }, [inscricaoId, edital.id, categoria, router])

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
        body: JSON.stringify({ campos, categoria: categoria || undefined }),
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
  }, [createInscricao, campos, categoria])

  // ─── Upload de anexo ──────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File, tipo: string, titulo: string) => {
    setUploading(true)
    setError('')

    try {
      const id = await createInscricao()
      if (!id) return

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
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
        body: JSON.stringify({ campos, categoria: categoria || undefined }),
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
  }, [inscricaoId, campos, categoria, router])

  // ─── Navegação entre etapas ───────────────────────────────────────────────

  const goNext = async () => {
    setError('')
    // Ao sair da etapa de categoria ou dados, salvar rascunho
    if (step === 'categoria' || step === 'dados') {
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
    const value = (campos[campo.nome] as string) ?? ''

    switch (campo.tipo) {
      case 'texto':
        return (
          <Input
            key={campo.nome}
            label={campo.label}
            value={value}
            onChange={(e) => updateCampo(campo.nome, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      case 'textarea':
        return (
          <Textarea
            key={campo.nome}
            label={campo.label}
            value={value}
            onChange={(e) => updateCampo(campo.nome, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
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
      case 'numero':
        return (
          <Input
            key={campo.nome}
            label={campo.label}
            type="number"
            value={value}
            onChange={(e) => updateCampo(campo.nome, e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      case 'data':
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
      case 'arquivo':
        // Arquivos são tratados na etapa de anexos
        return null
      default:
        return null
    }
  }

  // ─── Renderização ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Indicador de etapas */}
      <nav aria-label="Progresso da inscrição">
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => {
            const labels: Record<Step, string> = {
              categoria: 'Categoria',
              dados: 'Dados do Projeto',
              anexos: 'Anexos',
              revisao: 'Revisão',
            }
            const isActive = i === currentStep
            const isCompleted = i < currentStep

            return (
              <li key={s} className="flex items-center gap-2">
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
                  <span className="hidden sm:inline">{labels[s]}</span>
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
      {step === 'categoria' && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Selecione a Categoria</h2>
          <p className="text-sm text-slate-500 mb-6">
            Escolha a categoria em que seu projeto se enquadra neste edital.
          </p>
          <Select
            label="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            options={edital.categorias.map((cat): SelectOption => ({ value: cat, label: cat }))}
            placeholder="Selecione a categoria..."
            required
          />
        </Card>
      )}

      {/* ─── Etapa: Dados do Projeto ───────────────────────────────────────── */}
      {step === 'dados' && (
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

      {/* ─── Etapa: Anexos ─────────────────────────────────────────────────── */}
      {step === 'anexos' && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Documentos e Anexos</h2>
          <p className="text-sm text-slate-500 mb-6">
            Envie os documentos necessários para sua inscrição. Formatos aceitos: PDF, PNG, JPEG (máx. 10MB cada).
          </p>

          {/* Upload */}
          <AnexoUpload onUpload={handleUpload} uploading={uploading} />

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

          {anexos.length === 0 && (
            <p className="mt-4 text-sm text-amber-600">
              Envie pelo menos um documento para poder submeter sua inscrição.
            </p>
          )}
        </Card>
      )}

      {/* ─── Etapa: Revisão ────────────────────────────────────────────────── */}
      {step === 'revisao' && (
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
              </div>
            )}

            {/* Campos */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Dados do Projeto</h3>
              <dl className="space-y-3">
                {camposFormulario
                  .filter((c) => c.tipo !== 'arquivo')
                  .map((campo) => {
                    const valor = campos[campo.nome]
                    const isEmpty = valor === undefined || valor === null || valor === ''
                    return (
                      <div key={campo.nome} className="border-b border-slate-100 pb-3">
                        <dt className="text-sm text-slate-500">
                          {campo.label}
                          {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </dt>
                        <dd className={`text-sm mt-0.5 ${isEmpty ? 'text-red-500 italic' : 'text-slate-900'}`}>
                          {isEmpty ? 'Não preenchido' : String(valor)}
                        </dd>
                      </div>
                    )
                  })}
              </dl>
            </div>

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
          {(step === 'dados' || step === 'categoria') && (
            <Button variant="ghost" onClick={saveRascunho} loading={saving} type="button">
              Salvar rascunho
            </Button>
          )}
        </div>

        <div>
          {step !== 'revisao' ? (
            <Button onClick={goNext} type="button">
              Próximo
              <IconArrowRight className="h-4 w-4 ml-1" />
            </Button>
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

// ─── Componente de Upload ────────────────────────────────────────────────────

function AnexoUpload({
  onUpload,
  uploading,
}: {
  onUpload: (file: File, tipo: string, titulo: string) => Promise<void>
  uploading: boolean
}) {
  const [tipo, setTipo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const tipoOptions: SelectOption[] = [
    { value: 'DOCUMENTO_PESSOAL', label: 'Documento Pessoal' },
    { value: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço' },
    { value: 'PORTFOLIO', label: 'Portfólio / Currículo' },
    { value: 'PROJETO', label: 'Projeto / Proposta' },
    { value: 'ORCAMENTO', label: 'Orçamento' },
    { value: 'DECLARACAO', label: 'Declaração' },
    { value: 'OUTRO', label: 'Outro' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setFile(f)
      if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleSubmit = async () => {
    if (!file || !tipo || !titulo) return
    await onUpload(file, tipo, titulo)
    setFile(null)
    setTitulo('')
    setTipo('')
    // Reset file input
    const input = document.getElementById('anexo-file') as HTMLInputElement
    if (input) input.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}
        `}
      >
        <IconDocument className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600">
          {file ? (
            <span className="font-medium text-brand-700">{file.name}</span>
          ) : (
            <>Arraste um arquivo ou <span className="text-brand-600 font-medium">clique para selecionar</span></>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, PNG ou JPEG — máx. 10MB</p>
        <input
          id="anexo-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Selecionar arquivo para upload"
        />
      </div>

      {/* Metadados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo do documento"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          options={tipoOptions}
          placeholder="Selecione o tipo..."
          required
        />
        <Input
          label="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Projeto Cultural"
          required
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!file || !tipo || !titulo}
        loading={uploading}
        variant="secondary"
        type="button"
      >
        Enviar Anexo
      </Button>
    </div>
  )
}
