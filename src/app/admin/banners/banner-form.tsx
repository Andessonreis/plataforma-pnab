'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, Textarea } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'

interface BannerFormProps {
  initialData?: {
    id: string
    titulo: string
    texto: string
    ctaLabel: string
    ctaUrl: string
    ativo: boolean
    inicioEm: string
    fimEm: string
  }
  bannerId?: string
}

export function BannerForm({ initialData, bannerId }: BannerFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [texto, setTexto] = useState(initialData?.texto ?? '')
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(initialData?.ctaUrl ?? '')
  const [ativo, setAtivo] = useState(initialData?.ativo ?? true)
  const [inicioEm, setInicioEm] = useState(initialData?.inicioEm ?? '')
  const [fimEm, setFimEm] = useState(initialData?.fimEm ?? '')

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const body = {
      titulo,
      texto,
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
      ativo,
      inicioEm,
      fimEm,
    }

    try {
      const url = isEdit
        ? `/api/v1/banners/banner/${bannerId}`
        : '/api/v1/banners'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        const fieldErrors = Array.isArray(data.details)
          ? data.details.reduce(
              (acc: Record<string, string>, issue: { path?: unknown[]; message?: string }) => {
                const key = Array.isArray(issue.path) ? issue.path.join('.') : ''
                if (key && issue.message) acc[key] = issue.message
                return acc
              },
              {},
            )
          : {}

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          toast({
            variant: 'destructive',
            title: 'Verifique os campos do formulário',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar banner',
            description: data.message || 'Tente novamente em instantes.',
          })
        }
        return
      }

      toast({
        title: isEdit ? 'Banner atualizado' : 'Banner criado com sucesso',
      })
      if (!isEdit) {
        router.push(`/admin/banners/${data.data.id}`)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 sm:space-y-6">
      {/* Conteúdo */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Conteúdo</h2>
        <div className="space-y-4">
          <Input
            label="Título do Banner"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Inscrições Abertas — Edital Patrimônio Cultural"
          />

          <Textarea
            label="Texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            error={errors.texto}
            required
            placeholder="Mensagem exibida ao lado do título no banner do topo"
            rows={3}
          />
        </div>
      </Card>

      {/* CTA */}
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Link de Ação</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Texto do Botão (CTA)"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              error={errors.ctaLabel}
              placeholder="Ex: Inscreva-se"
              hint="Opcional"
            />

            <Input
              label="URL do Botão"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              error={errors.ctaUrl}
              placeholder="Ex: /editais/patrimonio-cultural"
              hint="Para onde o botão direciona"
            />
          </div>
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
            <span className="text-sm font-medium text-slate-700">Banner ativo</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Exibir a partir de"
              type="datetime-local"
              value={inicioEm}
              onChange={(e) => setInicioEm(e.target.value)}
              error={errors.inicioEm}
              required
              hint="Data e hora de início da exibição"
            />

            <Input
              label="Exibir até"
              type="datetime-local"
              value={fimEm}
              onChange={(e) => setFimEm(e.target.value)}
              error={errors.fimEm}
              required
              hint="Data e hora final da exibição"
            />
          </div>
        </div>
      </Card>

      {/* Botões */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/banners')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Banner'}
        </Button>
      </div>
    </form>
  )
}
