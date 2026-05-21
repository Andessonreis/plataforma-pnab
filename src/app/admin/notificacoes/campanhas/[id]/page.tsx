import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@client/components/ui'
import type { CampaignStatus } from '@prisma/client'
import { DispatchButton } from './dispatch-button'
import { CampaignActionButtons } from './action-buttons'
import { CampaignForm } from '../campaign-form'
import type { AudienceFilterInput } from '@/lib/notifications/schemas'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = await prisma.notificationCampaign.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Campanha: ${c?.titulo ?? id} — Portal PNAB Irecê` }
}

const STATUS_VARIANT: Record<CampaignStatus, 'neutral' | 'info' | 'success' | 'error' | 'warning'> = {
  RASCUNHO: 'neutral',
  ENVIANDO: 'warning',
  ENVIADA: 'success',
  CANCELADA: 'neutral',
  FALHA: 'error',
}

export default async function CampanhaDetalhePage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id },
    include: {
      rule: { select: { id: true, nome: true } },
      createdBy: { select: { nome: true } },
    },
  })

  if (!campaign) notFound()

  const editais =
    campaign.status === 'RASCUNHO'
      ? await prisma.edital.findMany({
          where: { status: { not: 'RASCUNHO' } },
          select: { id: true, titulo: true, slug: true },
          orderBy: { createdAt: 'desc' },
        })
      : []

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin/notificacoes/campanhas"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Campanhas
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{campaign.titulo}</h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <Badge variant={STATUS_VARIANT[campaign.status]}>{campaign.status}</Badge>
              <Badge variant="neutral">{campaign.tipo}</Badge>
              {campaign.rule && (
                <span>Regra: {campaign.rule.nome}</span>
              )}
              {campaign.createdBy && <span>por {campaign.createdBy.nome}</span>}
              <span>
                {new Date(campaign.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </span>
            </div>
          </div>
          <CampaignActionButtons
            campaignId={campaign.id}
            campaignTitle={campaign.titulo}
            status={campaign.status}
            totalEnviado={campaign.totalEnviado}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Total alvo</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{campaign.totalAlvo}</p>
        </Card>
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Entregues</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{campaign.totalEnviado}</p>
        </Card>
        <Card padding="sm" className="sm:p-5">
          <p className="text-xs text-slate-500">Erros</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{campaign.totalErro}</p>
        </Card>
      </div>

      {campaign.status === 'RASCUNHO' ? (
        <>
          <Card padding="sm" className="sm:p-6 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-slate-900">Pronto pra disparar</p>
                <p className="text-xs text-slate-500">
                  Você pode editar abaixo OU pré-visualizar a audiência e disparar agora.
                </p>
              </div>
              <DispatchButton campaignId={campaign.id} />
            </div>
          </Card>

          <CampaignForm
            editais={editais}
            campaignId={campaign.id}
            initialData={{
              id: campaign.id,
              titulo: campaign.titulo,
              assunto: campaign.assunto,
              corpo: campaign.corpo,
              link: campaign.link ?? '',
              ctaLabel: campaign.ctaLabel ?? '',
              canais: campaign.canais,
              filtro: (campaign.filtro ?? {}) as AudienceFilterInput,
            }}
          />
        </>
      ) : (
        <Card padding="sm" className="sm:p-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Assunto</p>
            <p className="text-sm font-medium text-slate-900">{campaign.assunto}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Corpo</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{campaign.corpo}</p>
          </div>
          {campaign.link && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Link</p>
              <p className="text-sm text-brand-600 break-all">{campaign.link}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">Canais</p>
            <div className="flex flex-wrap gap-2">
              {campaign.canais.map((c) => (
                <Badge key={c} variant="info">{c}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Filtro (snapshot)</p>
            <pre className="text-[11px] bg-slate-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(campaign.filtro, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </section>
  )
}
