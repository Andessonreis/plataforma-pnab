'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Textarea, Button, Badge } from '@client/components/ui'
import { toast } from '@client/hooks/use-toast'
import { AudienceBuilder, type EditalOption } from '../audience-builder'
import { LinkPicker } from '../link-picker'
import { NotificationPreview } from '../notification-preview'
import { MESSAGE_TEMPLATES, type MessageTemplate } from '../templates'
import type { AudienceFilterInput } from '@server/lib/notifications/schemas'

interface TriggerOption {
  trigger: string
  label: string
  descricao: string
  implementado: boolean
  periodico: boolean
}

interface RuleFormProps {
  editais: EditalOption[]
  triggers: TriggerOption[]
  initialData?: {
    id: string
    nome: string
    descricao: string
    trigger: string
    config: Record<string, unknown>
    assunto: string
    corpo: string
    link: string
    ctaLabel: string
    canais: Array<'IN_APP' | 'EMAIL'>
    filtro: AudienceFilterInput
  }
  ruleId?: string
}

export function RuleForm({ editais, triggers, initialData, ruleId }: RuleFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [nome, setNome] = useState(initialData?.nome ?? '')
  const [descricao, setDescricao] = useState(initialData?.descricao ?? '')
  const [trigger, setTrigger] = useState(initialData?.trigger ?? triggers.find((t) => t.implementado)?.trigger ?? '')
  const [horas, setHoras] = useState<number>(
    (initialData?.config?.horas as number) ?? 24,
  )
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

    const hasContent = (assunto || corpo || ctaLabel).trim().length > 0
    if (hasContent && !confirm('Aplicar o modelo vai sobrescrever o conteúdo da mensagem. Continuar?')) {
      setTemplateId('')
      return
    }

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

  const selectedTrigger = triggers.find((t) => t.trigger === trigger)
  const showHorasInput = trigger === 'INSCRICAO_RASCUNHO_PENDENTE'

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

    const config: Record<string, unknown> = {}
    if (showHorasInput) {
      config.horas = horas
      if (filtro.editais && filtro.editais.length > 0) {
        config.editalIds = filtro.editais
      }
    }

    const body = {
      nome,
      descricao: descricao || null,
      trigger,
      config,
      assunto,
      corpo,
      link: link || null,
      ctaLabel: ctaLabel || null,
      canais,
      filtro,
    }

    try {
      const url = isEdit
        ? `/api/admin/notifications/rules/${ruleId}`
        : '/api/admin/notifications/rules'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
          toast({ variant: 'destructive', title: 'Verifique os campos' })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar regra',
            description: data.message,
          })
        }
        return
      }

      toast({ title: isEdit ? 'Regra atualizada' : 'Regra criada (desativada)' })
      if (!isEdit) {
        router.push(`/admin/notificacoes/regras/${data.id}`)
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
          1. Identificar
        </h2>
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">
          Só pra você organizar internamente — esses textos não vão pro destinatário.
        </p>
        <div className="space-y-4">
          <Input
            label="Nome curto da regra"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            required
            placeholder='Ex: "Lembrete rascunho 24h"'
          />
          <Textarea
            label="Anotação interna (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            error={errors.descricao}
            rows={2}
            placeholder="Pra que serve essa regra, quem decidiu, etc."
          />
        </div>
      </Card>

      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">2. Quando enviar?</h2>
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">
          Escolha o evento ou condição que dispara a notificação automaticamente.
        </p>
        <div className="space-y-3">
          {triggers.map((t) => (
            <label
              key={t.trigger}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border min-h-[60px] transition-colors ${
                trigger === t.trigger
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-200 hover:bg-slate-50'
              } ${!t.implementado ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="trigger"
                value={t.trigger}
                checked={trigger === t.trigger}
                onChange={(e) => setTrigger(e.target.value)}
                disabled={!t.implementado}
                className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-900">{t.label}</p>
                  {t.periodico && <Badge variant="neutral">periódico</Badge>}
                  {!t.implementado && <Badge variant="warning">em breve</Badge>}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{t.descricao}</p>
              </div>
            </label>
          ))}
          {errors.trigger && <p className="text-xs text-red-600">{errors.trigger}</p>}
        </div>

        {showHorasInput && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <Input
              label="Horas em rascunho antes de notificar"
              type="number"
              min={1}
              value={String(horas)}
              onChange={(e) => setHoras(Number(e.target.value))}
              hint="Padrão: 24h. Inscrições com updatedAt mais antigo que isso disparam a regra."
            />
          </div>
        )}

        {selectedTrigger && !selectedTrigger.periodico && (
          <p className="text-xs text-slate-500 mt-3">
            Este gatilho é disparado <strong>sob demanda</strong>, quando o evento correspondente acontecer.
          </p>
        )}
      </Card>

      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">3. O que dizer?</h2>
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">
          Comece de um modelo pronto ou escreva do zero. O preview ao lado mostra como vai aparecer.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="rule-template-select" className="block text-sm font-medium text-slate-700 mb-1.5">
              Modelo pronto (opcional)
            </label>
            <select
              id="rule-template-select"
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
          />
          <LinkPicker value={link} onChange={setLink} editais={editais} />
          {link && (
            <Input
              label="Texto do botão"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder='Ex: "Continuar minha inscrição"'
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
          onClick={() => router.push('/admin/notificacoes/regras')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Regra (inativa)'}
        </Button>
      </div>
      </div>

      {/* Coluna lateral: preview ao vivo */}
      <div className="lg:col-span-1">
        <NotificationPreview
          titulo={assunto}
          assunto={assunto}
          corpo={corpo}
          link={link}
          ctaLabel={ctaLabel}
        />
      </div>
    </form>
  )
}
