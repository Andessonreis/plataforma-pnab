'use client'

import { useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea, Select } from '@/components/ui'
import type { EditalStatus } from '@prisma/client'
import { EditalArquivos, type EditalArquivosHandle } from './edital-arquivos'

interface CronogramaItem {
  label: string
  dataHora: string
  destaque: boolean
}

interface EditalFormProps {
  initialData?: {
    id: string
    titulo: string
    resumo: string
    ano: number
    valorTotal: string
    categorias: string[]
    acoesAfirmativas: string
    regrasElegibilidade: string
    cronograma: CronogramaItem[]
    status: EditalStatus
  }
}

const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'INSCRICOES_ABERTAS', label: 'Inscricoes Abertas' },
  { value: 'INSCRICOES_ENCERRADAS', label: 'Inscricoes Encerradas' },
  { value: 'HABILITACAO', label: 'Habilitacao' },
  { value: 'AVALIACAO', label: 'Avaliacao' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

export function EditalForm({ initialData }: EditalFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const arquivosRef = useRef<EditalArquivosHandle>(null)

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [resumo, setResumo] = useState(initialData?.resumo ?? '')
  const [ano, setAno] = useState(initialData?.ano ?? new Date().getFullYear())
  const [valorTotal, setValorTotal] = useState(initialData?.valorTotal ?? '')
  const [categoriasText, setCategoriasText] = useState(initialData?.categorias.join(', ') ?? '')
  const [acoesAfirmativas, setAcoesAfirmativas] = useState(initialData?.acoesAfirmativas ?? '')
  const [regrasElegibilidade, setRegrasElegibilidade] = useState(initialData?.regrasElegibilidade ?? '')
  const [status, setStatus] = useState<string>(initialData?.status ?? 'RASCUNHO')
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(initialData?.cronograma ?? [])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addCronogramaItem() {
    setCronograma([...cronograma, { label: '', dataHora: '', destaque: false }])
  }

  function updateCronogramaItem(index: number, field: keyof CronogramaItem, value: string | boolean) {
    const updated = [...cronograma]
    updated[index] = { ...updated[index], [field]: value }
    setCronograma(updated)
  }

  function removeCronogramaItem(index: number) {
    setCronograma(cronograma.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    const categorias = categoriasText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const body = {
      titulo,
      resumo,
      ano,
      valorTotal: valorTotal ? parseFloat(valorTotal) : null,
      categorias,
      acoesAfirmativas: acoesAfirmativas || null,
      regrasElegibilidade: regrasElegibilidade || null,
      status,
      cronograma,
    }

    try {
      const url = isEdit
        ? `/api/admin/editais?id=${initialData.id}`
        : '/api/admin/editais'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
        } else {
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar edital.' })
        }
        return
      }

      // Envia arquivos pendentes após criar o edital
      if (!isEdit && arquivosRef.current?.hasPending()) {
        const errors = await arquivosRef.current.uploadPending(data.id)
        if (errors > 0) {
          setMessage({ type: 'error', text: `Edital criado, mas ${errors} arquivo(s) falharam no envio.` })
        } else {
          setMessage({ type: 'success', text: 'Edital criado com sucesso.' })
        }
        router.push(`/admin/editais/${data.id}`)
      } else {
        setMessage({ type: 'success', text: isEdit ? 'Edital atualizado.' : 'Edital criado com sucesso.' })
        if (!isEdit) {
          router.push(`/admin/editais/${data.id}`)
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Informacoes basicas */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informacoes Basicas</h2>
        <div className="space-y-4">
          <Input
            label="Titulo do Edital"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Edital de Fomento a Cultura 2026"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ano"
              type="number"
              value={String(ano)}
              onChange={(e) => setAno(Number(e.target.value))}
              error={errors.ano}
              required
              min={2020}
              max={2099}
            />
            <Input
              label="Valor Total (R$)"
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              error={errors.valorTotal}
              placeholder="150000.00"
            />
          </div>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            required
          />

          <Textarea
            label="Resumo"
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            error={errors.resumo}
            placeholder="Breve descricao do edital..."
            rows={3}
          />

          <Input
            label="Categorias"
            value={categoriasText}
            onChange={(e) => setCategoriasText(e.target.value)}
            error={errors.categorias}
            hint="Separe por virgula. Ex: Artes Visuais, Musica, Teatro, Danca"
            placeholder="Artes Visuais, Musica, Teatro"
          />
        </div>
      </Card>

      {/* Regras */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Regras e Elegibilidade</h2>
        <div className="space-y-4">
          <Textarea
            label="Regras de Elegibilidade"
            value={regrasElegibilidade}
            onChange={(e) => setRegrasElegibilidade(e.target.value)}
            placeholder="Quem pode participar, requisitos..."
            rows={4}
          />
          <Textarea
            label="Acoes Afirmativas"
            value={acoesAfirmativas}
            onChange={(e) => setAcoesAfirmativas(e.target.value)}
            placeholder="Cotas, bonificacoes para grupos especificos..."
            rows={3}
          />
        </div>
      </Card>

      {/* Cronograma */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Cronograma</h2>
          <Button type="button" variant="outline" size="sm" onClick={addCronogramaItem}>
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Marco
          </Button>
        </div>

        {cronograma.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum marco adicionado. Clique em &quot;Adicionar Marco&quot; para comecar.
          </p>
        ) : (
          <div className="space-y-3">
            {cronograma.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Descricao"
                    value={item.label}
                    onChange={(e) => updateCronogramaItem(index, 'label', e.target.value)}
                    placeholder="Ex: Inicio das inscricoes"
                  />
                  <Input
                    label="Data e Hora"
                    type="datetime-local"
                    value={item.dataHora}
                    onChange={(e) => updateCronogramaItem(index, 'dataHora', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-7">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.destaque}
                      onChange={(e) => updateCronogramaItem(index, 'destaque', e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Destaque
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCronogramaItem(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                    aria-label="Remover marco"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Documentos e Anexos */}
      <EditalArquivos ref={arquivosRef} editalId={isEdit ? initialData.id : undefined} />

      {/* Botoes */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/editais')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alteracoes' : 'Criar Edital'}
        </Button>
      </div>
    </form>
  )
}
