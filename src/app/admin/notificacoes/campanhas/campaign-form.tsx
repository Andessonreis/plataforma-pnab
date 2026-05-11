'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Textarea, Button } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { AudienceBuilder, type EditalOption } from '../audience-builder'
import type { AudienceFilterInput } from '@/lib/notifications/schemas'

interface CampaignFormProps {
  editais: EditalOption[]
  initialData?: {
    id: string
    titulo: string
    assunto: string
    corpo: string
    link: string
    ctaLabel: string
    canais: Array<'IN_APP' | 'EMAIL'>
    filtro: AudienceFilterInput
  }
  campaignId?: string
}

export function CampaignForm({ editais, initialData, campaignId }: CampaignFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [titulo, setTitulo] = useState(initialData?.titulo ?? '')
  const [assunto, setAssunto] = useState(initialData?.assunto ?? '')
  const [corpo, setCorpo] = useState(initialData?.corpo ?? '')
  const [link, setLink] = useState(initialData?.link ?? '')
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? '')
  const [canalInApp, setCanalInApp] = useState<boolean>(
    initialData?.canais?.includes('IN_APP') ?? true,
  )
  const [canalEmail, setCanalEmail] = useState<boolean>(
    initialData?.canais?.includes('EMAIL') ?? false,
  )
  const [filtro, setFiltro] = useState<AudienceFilterInput>(initialData?.filtro ?? {})

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const canais: Array<'IN_APP' | 'EMAIL'> = [
      ...(canalInApp ? ['IN_APP' as const] : []),
      ...(canalEmail ? ['EMAIL' as const] : []),
    ]

    if (canais.length === 0) {
      setErrors({ canais: 'Selecione ao menos um canal' })
      setLoading(false)
      return
    }

    const body = {
      titulo,
      assunto,
      corpo,
      link: link || null,
      ctaLabel: ctaLabel || null,
      canais,
      filtro,
    }

    try {
      const url = isEdit
        ? `/api/admin/notifications/campaigns/${campaignId}`
        : '/api/admin/notifications/campaigns'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
          toast({ variant: 'destructive', title: 'Verifique os campos do formulário' })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar campanha',
            description: data.message || 'Tente novamente em instantes.',
          })
        }
        return
      }

      toast({ title: isEdit ? 'Campanha atualizada' : 'Campanha criada' })
      if (!isEdit) {
        router.push(`/admin/notificacoes/campanhas/${data.id}`)
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 sm:space-y-6">
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
          Mensagem
        </h2>
        <div className="space-y-4">
          <Input
            label="Título interno"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder="Ex: Lembrete rascunhos PNAB 2026 (visível só no admin)"
          />
          <Input
            label="Assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            error={errors.assunto}
            required
            placeholder="Título exibido pro destinatário"
          />
          <Textarea
            label="Corpo"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            error={errors.corpo}
            required
            rows={6}
            placeholder="Mensagem completa. Texto puro — aceita quebras de linha."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Link de ação (opcional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              error={errors.link}
              placeholder="/proponente/inscricoes/abc123"
            />
            <Input
              label="Rótulo do botão"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              error={errors.ctaLabel}
              placeholder="Ex: Acessar inscrição"
            />
          </div>
        </div>
      </Card>

      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
          Canais de entrega
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={canalInApp}
              onChange={(e) => setCanalInApp(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Na plataforma (sininho + página)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={canalEmail}
              onChange={(e) => setCanalEmail(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Email
              <span className="ml-2 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                gated por NOTIFICATION_EMAIL_ENABLED
              </span>
            </span>
          </label>
          {errors.canais && <p className="text-xs text-red-600">{errors.canais}</p>}
        </div>
      </Card>

      <AudienceBuilder value={filtro} onChange={setFiltro} editais={editais} />

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/notificacoes/campanhas')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Rascunho'}
        </Button>
      </div>
    </form>
  )
}
