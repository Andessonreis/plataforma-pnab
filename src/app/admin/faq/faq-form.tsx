'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea, Select } from '@/components/ui'

interface FaqFormProps {
  initialData?: {
    pergunta: string
    resposta: string
    editalId: string | null
    ordem: number
    publicado: boolean
  }
  faqItemId?: string
  editais: Array<{ id: string; titulo: string }>
}

export function FaqForm({ initialData, faqItemId, editais }: FaqFormProps) {
  const router = useRouter()
  const isEdit = !!faqItemId

  const [pergunta, setPergunta] = useState(initialData?.pergunta ?? '')
  const [resposta, setResposta] = useState(initialData?.resposta ?? '')
  const [editalId, setEditalId] = useState(initialData?.editalId ?? '')
  const [ordem, setOrdem] = useState(initialData?.ordem ?? 0)
  const [publicado, setPublicado] = useState(initialData?.publicado ?? true)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editalOptions = [
    { value: '', label: 'Nenhum (FAQ Geral)' },
    ...editais.map((e) => ({ value: e.id, label: e.titulo })),
  ]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    const body = {
      pergunta,
      resposta,
      editalId: editalId || null,
      ordem,
      publicado,
    }

    try {
      const url = isEdit
        ? `/api/admin/faq?id=${faqItemId}`
        : '/api/admin/faq'

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
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar item de FAQ.' })
        }
        return
      }

      setMessage({ type: 'success', text: isEdit ? 'Item de FAQ atualizado.' : 'Item de FAQ criado com sucesso.' })
      if (!isEdit) {
        router.push(`/admin/faq/${data.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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

      {/* Conteudo */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Conteudo</h2>
        <div className="space-y-4">
          <Input
            label="Pergunta"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            error={errors.pergunta}
            required
            placeholder="Ex: Como me inscrever em um edital?"
          />

          <Textarea
            label="Resposta"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            error={errors.resposta}
            required
            placeholder="Escreva a resposta completa..."
            rows={5}
          />
        </div>
      </Card>

      {/* Configuracao */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuracao</h2>
        <div className="space-y-4">
          <Select
            label="Edital Relacionado"
            value={editalId}
            onChange={(e) => setEditalId(e.target.value)}
            options={editalOptions}
          />

          <Input
            label="Ordem de Exibicao"
            type="number"
            value={String(ordem)}
            onChange={(e) => setOrdem(Number(e.target.value))}
            error={errors.ordem}
            hint="Itens com menor numero aparecem primeiro."
            min={0}
          />

          <div className="flex items-center gap-3">
            <label htmlFor="faq-publicado" className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                id="faq-publicado"
                type="checkbox"
                checked={publicado}
                onChange={(e) => setPublicado(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-700">Publicado</span>
            </label>
            <p className="text-xs text-slate-500">Itens ocultos nao aparecem na pagina publica de FAQ.</p>
          </div>
        </div>
      </Card>

      {/* Botoes */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/faq')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alteracoes' : 'Criar Item'}
        </Button>
      </div>
    </form>
  )
}
