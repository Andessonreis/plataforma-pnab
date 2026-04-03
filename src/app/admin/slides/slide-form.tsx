'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea } from '@/components/ui'

interface SlideFormProps {
  initialData?: {
    id: string
    titulo: string
    descricao: string
    imagemUrl: string
    ctaLabel: string
    ctaUrl: string
    ordem: number
    ativo: boolean
    inicioEm: string
    fimEm: string
  }
  slideId?: string
}

export function SlideForm({ initialData, slideId }: SlideFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [descricao, setDescricao] = useState(initialData?.descricao ?? '')
  const [imagemUrl, setImagemUrl] = useState(initialData?.imagemUrl ?? '')
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(initialData?.ctaUrl ?? '')
  const [ordem, setOrdem] = useState(initialData?.ordem ?? 0)
  const [ativo, setAtivo] = useState(initialData?.ativo ?? true)
  const [inicioEm, setInicioEm] = useState(initialData?.inicioEm ?? '')
  const [fimEm, setFimEm] = useState(initialData?.fimEm ?? '')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    const body = {
      titulo,
      descricao: descricao || null,
      imagemUrl: imagemUrl || null,
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
      ordem,
      ativo,
      inicioEm: inicioEm || null,
      fimEm: fimEm || null,
    }

    try {
      const url = isEdit
        ? `/api/admin/slides/${slideId}`
        : '/api/admin/slides'

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
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar slide.' })
        }
        return
      }

      setMessage({ type: 'success', text: isEdit ? 'Slide atualizado.' : 'Slide criado com sucesso.' })
      if (!isEdit) {
        router.push(`/admin/slides/${data.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 sm:space-y-6">
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

      {/* Conteúdo */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Conteúdo</h2>
        <div className="space-y-4">
          <Input
            label="Título do Slide"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Inscrições Abertas — Edital de Fomento 2026"
          />

          <Textarea
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            error={errors.descricao}
            placeholder="Texto descritivo do slide (opcional)"
            rows={3}
          />

          <Input
            label="URL da Imagem de Fundo"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            error={errors.imagemUrl}
            placeholder="https://exemplo.com/imagem.jpg"
            hint="Imagem de fundo do slide (opcional). Sem imagem, usa gradiente."
          />
        </div>
      </Card>

      {/* CTA e Ordenação */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Link e Ordenação</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Texto do Botão (CTA)"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              error={errors.ctaLabel}
              placeholder="Ex: Saiba mais"
              hint="Texto do botão de ação"
            />

            <Input
              label="URL do Botão"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              error={errors.ctaUrl}
              placeholder="Ex: /editais/edital-2026"
              hint="Para onde o botão direciona"
            />
          </div>

          <Input
            label="Ordem de Exibição"
            type="number"
            value={String(ordem)}
            onChange={(e) => setOrdem(Number(e.target.value))}
            error={errors.ordem}
            hint="Slides são ordenados do menor para o maior"
          />
        </div>
      </Card>

      {/* Visibilidade */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Visibilidade</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Slide ativo</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Exibir a partir de"
              type="datetime-local"
              value={inicioEm}
              onChange={(e) => setInicioEm(e.target.value)}
              error={errors.inicioEm}
              hint="Deixe em branco para exibir imediatamente"
            />

            <Input
              label="Exibir até"
              type="datetime-local"
              value={fimEm}
              onChange={(e) => setFimEm(e.target.value)}
              error={errors.fimEm}
              hint="Deixe em branco para exibir indefinidamente"
            />
          </div>
        </div>
      </Card>

      {/* Botões */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/slides')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Slide'}
        </Button>
      </div>
    </form>
  )
}
