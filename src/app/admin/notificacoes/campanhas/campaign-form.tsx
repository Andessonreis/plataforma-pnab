'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Textarea, Button } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'
import { AudienceBuilder, type EditalOption } from '../audience-builder'
import { LinkPicker } from '../link-picker'
import { NotificationPreview } from '../notification-preview'
import { MESSAGE_TEMPLATES, type MessageTemplate } from '../templates'
import type { AudienceFilterInput } from '@shared/schemas/notifications.schema'

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
  const canalInApp = true
  const canalEmail = initialData?.canais?.includes('EMAIL') ?? false
  const [filtro, setFiltro] = useState<AudienceFilterInput>(initialData?.filtro ?? {})

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [templateId, setTemplateId] = useState<string>('')

  function applyTemplate(id: string) {
    setTemplateId(id)
    if (!id) return
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === id)
    if (!tpl) return

    const hasContent = (titulo || assunto || corpo || ctaLabel).trim().length > 0
    if (hasContent && !confirm('Aplicar o modelo vai sobrescrever o que você já digitou. Continuar?')) {
      setTemplateId('')
      return
    }

    setTitulo(tpl.titulo)
    setAssunto(tpl.assunto)
    setCorpo(tpl.corpo)
    setCtaLabel(tpl.ctaLabel)
    setLink(resolveTemplateLink(tpl))
  }

  function resolveTemplateLink(tpl: MessageTemplate): string {
    switch (tpl.link.mode) {
      case 'NONE':
        return ''
      case 'MY_INSCRICOES':
        return '/proponente/inscricoes'
      case 'EDITAL':
        return ''
      case 'CUSTOM':
        return tpl.link.value
    }
  }

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
        ? `/api/v1/notificacoes/campanhas/campanha/${campaignId}`
        : '/api/v1/notificacoes/campanhas/campanha'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        const fieldErrors = Array.isArray(json.details)
          ? json.details.reduce(
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
          toast({ variant: 'destructive', title: 'Verifique os campos do formulário' })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar campanha',
            description: json.message || 'Tente novamente em instantes.',
          })
        }
        return
      }

      toast({ title: isEdit ? 'Campanha atualizada' : 'Campanha criada' })
      if (!isEdit) {
        router.push(`/admin/notificacoes/campanhas/${json.data.id}`)
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
      <div className="lg:col-span-2 space-y-5 sm:space-y-6">
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
          1. O que dizer?
        </h2>
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">
          Comece de um modelo pronto ou escreva do zero. O preview ao lado mostra como vai aparecer.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="template-select" className="block text-sm font-medium text-slate-700 mb-1.5">
              Modelo pronto (opcional)
            </label>
            <select
              id="template-select"
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">— Escolher modelo —</option>
              {MESSAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {templateId && (
              <p className="mt-1.5 text-xs text-slate-500">
                {MESSAGE_TEMPLATES.find((t) => t.id === templateId)?.description}
              </p>
            )}
          </div>
          <Input
            label="Nome interno (não aparece pro destinatário)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            error={errors.titulo}
            required
            placeholder='Ex: "Lembrete rascunhos PNAB 2026"'
          />
          <Input
            label="Título da notificação"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            error={errors.assunto}
            required
            placeholder="Aparece como assunto do e-mail e título do card"
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
          <LinkPicker value={link} onChange={setLink} editais={editais} />
          {link && (
            <Input
              label="Texto do botão"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              error={errors.ctaLabel}
              placeholder='Ex: "Ver minhas inscrições"'
              hint="É o texto que aparece no botão da notificação."
            />
          )}
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
      </div>

      {/* Coluna lateral: preview ao vivo */}
      <div className="lg:col-span-1">
        <NotificationPreview
          titulo={titulo}
          assunto={assunto}
          corpo={corpo}
          link={link}
          ctaLabel={ctaLabel}
        />
      </div>
    </form>
  )
}
