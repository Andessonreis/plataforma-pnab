import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@client/components/ui'
import { TRIGGER_REGISTRY } from '@/lib/notifications/triggers'
import { RuleForm } from '../rule-form'
import { ToggleRuleButton } from './toggle-button'
import { DeleteRuleButton } from './delete-button'
import type { AudienceFilterInput } from '@/lib/notifications/schemas'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const r = await prisma.notificationRule.findUnique({ where: { id }, select: { nome: true } })
  return { title: `Regra: ${r?.nome ?? id} — Portal PNAB Irecê` }
}

export default async function RegraDetalhePage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const rule = await prisma.notificationRule.findUnique({
    where: { id },
    include: { _count: { select: { campaigns: true } } },
  })

  if (!rule) notFound()

  const def = TRIGGER_REGISTRY[rule.trigger]

  const editais = await prisma.edital.findMany({
    where: { status: { not: 'RASCUNHO' } },
    select: { id: true, titulo: true, slug: true },
    orderBy: { createdAt: 'desc' },
  })

  const triggers = Object.values(TRIGGER_REGISTRY).map((t) => ({
    trigger: t.trigger,
    label: t.label,
    descricao: t.descricao,
    implementado: t.implementado,
    periodico: t.periodico,
  }))

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/notificacoes/regras"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Regras
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{rule.nome}</h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <Badge variant={rule.ativo ? 'success' : 'neutral'}>
                {rule.ativo ? 'Ativa' : 'Inativa'}
              </Badge>
              <span>{def?.label ?? rule.trigger}</span>
              {!def?.implementado && <Badge variant="warning">em breve</Badge>}
              <span>{rule._count.campaigns} disparo(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToggleRuleButton
              ruleId={rule.id}
              ativo={rule.ativo}
              implementado={def?.implementado ?? false}
            />
            <DeleteRuleButton ruleId={rule.id} ruleName={rule.nome} />
          </div>
        </div>
      </div>

      {rule.ativo && (
        <Card padding="sm" className="sm:p-4 mb-4 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-emerald-900">
            <strong>Regra ativa.</strong> {def?.periodico ? 'É avaliada periodicamente pelo scheduler.' : 'Dispara sob demanda quando o evento correspondente acontece.'}
          </p>
        </Card>
      )}

      <RuleForm
        editais={editais}
        triggers={triggers}
        ruleId={rule.id}
        initialData={{
          id: rule.id,
          nome: rule.nome,
          descricao: rule.descricao ?? '',
          trigger: rule.trigger,
          config: (rule.config ?? {}) as Record<string, unknown>,
          assunto: rule.assunto,
          corpo: rule.corpo,
          link: rule.link ?? '',
          ctaLabel: rule.ctaLabel ?? '',
          canais: rule.canais,
          filtro: (rule.filtro ?? {}) as AudienceFilterInput,
        }}
      />
    </section>
  )
}
