'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea } from '@/components/ui'

interface CmsFormProps {
  initialData?: {
    id: string
    titulo: string
    corpo: string
    publicado: boolean
  }
}

export function CmsForm({ initialData }: CmsFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [corpo, setCorpo] = useState(initialData?.corpo ?? '')
  const [publicado, setPublicado] = useState(initialData?.publicado ?? false)

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
      corpo,
      publicado,
    }

    try {
      const url = isEdit
        ? `/api/admin/cms?id=${initialData.id}`
        : '/api/admin/cms'

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
          setMessage({ type: 'error', text: data.message || 'Erro ao salvar pagina.' })
        }
        return
      }

      setMessage({ type: 'success', text: isEdit ? 'Pagina atualizada.' : 'Pagina criada com sucesso.' })
      if (!isEdit) {
        router.push(`/admin/cms/${data.id}`)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Tem certeza que deseja excluir esta pagina? Esta acao nao pode ser desfeita.')) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/cms/${initialData.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.message || 'Erro ao excluir pagina.' })
        return
      }

      router.push('/admin/cms')
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
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
            label="Titulo da Pagina"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Politica de Privacidade"
          />

          <div>
            <Textarea
              label="Corpo (HTML)"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              error={errors.corpo}
              required
              placeholder="<h2>Titulo da secao</h2>&#10;<p>Conteudo do paragrafo...</p>"
              rows={16}
              hint="Escreva o conteudo em HTML. Tags suportadas: h2, h3, p, ul, ol, li, a, strong, em."
            />
          </div>
        </div>
      </Card>

      {/* Publicacao */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Publicacao</h2>
        <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-900">Publicar pagina</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Paginas publicadas ficam visiveis no site em /pagina/slug
            </p>
          </div>
        </label>
      </Card>

      {/* Botoes */}
      <div className="flex items-center justify-between">
        <div>
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Excluir Pagina
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/cms')}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Salvar Alteracoes' : 'Criar Pagina'}
          </Button>
        </div>
      </div>
    </form>
  )
}
