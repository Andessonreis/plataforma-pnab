'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Textarea, Button, Badge } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { AudienceBuilder, type EditalOption } from '../audience-builder'
import type { AudienceFilterInput } from '@/lib/notifications/schemas'

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
  const [canalInApp, setCanalInApp] = useState<boolean>(
    initialData?.canais?.includes('IN_APP') ?? true,
  )
  const [canalEmail, setCanalEmail] = useState<boolean>(
    initialData?.canais?.includes('EMAIL') ?? false,
  )
  const [filtro, setFiltro] = useState<AudienceFilterInput>(initialData?.filtro ?? {})

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 sm:space-y-6">
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
          Identificação
        </h2>
        <div className="space-y-4">
          <Input
            label="Nome da regra"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            required
            placeholder='Ex: "Lembrete rascunhos 24h"'
          />
          <Textarea
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            error={errors.descricao}
            rows={2}
            placeholder="Anotações internas — não aparece pro destinatário."
          />
        </div>
      </Card>

      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Gatilho</h2>
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
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Mensagem</h2>
        <div className="space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Link de ação"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/proponente/inscricoes/abc123"
            />
            <Input
              label="Rótulo do botão"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Ex: Continuar inscrição"
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
            <span className="text-sm font-medium text-slate-700">Na plataforma</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={canalEmail}
              onChange={(e) => setCanalEmail(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Email{' '}
              <span className="ml-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                gated
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
          onClick={() => router.push('/admin/notificacoes/regras')}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Regra (inativa)'}
        </Button>
      </div>
    </form>
  )
}
