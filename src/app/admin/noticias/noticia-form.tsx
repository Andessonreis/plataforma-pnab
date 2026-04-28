'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea } from '@/components/ui'

interface NoticiaFormProps {
  initialData?: {
    id: string
    titulo: string
    corpo: string
    tags: string[]
    imagemUrl: string
    publicado: boolean
    publicadoEm: string
  }
  noticiaId?: string
}

export function NoticiaForm({ initialData, noticiaId }: NoticiaFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [corpo, setCorpo] = useState(initialData?.corpo ?? '')
  const [tagsText, setTagsText] = useState(initialData?.tags.join(', ') ?? '')
  const [imagemUrl, setImagemUrl] = useState(initialData?.imagemUrl ?? '')
  const [publicado, setPublicado] = useState(initialData?.publicado ?? false)
  const [publicadoEm, setPublicadoEm] = useState(initialData?.publicadoEm ?? '')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const body = {
      titulo,
      corpo,
      tags,
      imagemUrl: imagemUrl || null,
      publicado,
      publicadoEm: publicadoEm || null,
    }

    try {
      const url = isEdit
        ? `/api/admin/noticias?id=${noticiaId}`
        : '/api/admin/noticias'

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
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar notícia.' })
        }
        return
      }

      setMessage({ type: 'success', text: isEdit ? 'Notícia atualizada.' : 'Notícia criada com sucesso.' })
      if (!isEdit) {
        setTimeout(() => router.push(`/admin/noticias/${data.id}`), 1500)
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
            label="Título da Notícia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Resultado do Edital de Fomento 2026"
          />

          <Textarea
            label="Corpo da Notícia"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            error={errors.corpo}
            required
            placeholder="Escreva o conteúdo da notícia..."
            rows={10}
          />

          <Input
            label="URL da Imagem"
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            error={errors.imagemUrl}
            placeholder="https://exemplo.com/imagem.jpg"
            hint="URL da imagem de capa (opcional)"
          />
        </div>
      </Card>

      {/* Publicação */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Publicação</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={publicado}
              onChange={(e) => setPublicado(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Publicar notícia</span>
          </label>

          <Input
            label="Data de Publicação"
            type="datetime-local"
            value={publicadoEm}
            onChange={(e) => setPublicadoEm(e.target.value)}
            error={errors.publicadoEm}
            hint="Deixe em branco para usar a data atual ao publicar"
          />

          <Input
            label="Tags"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            error={errors.tags}
            hint="Separe por vírgula. Ex: Cultura, Edital, Resultado"
            placeholder="Cultura, Edital, Resultado"
          />
        </div>
      </Card>

      {/* Botões */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/noticias')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Notícia'}
        </Button>
      </div>
    </form>
  )
}
