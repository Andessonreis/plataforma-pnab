import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconChatBubble } from '@client/components/ui'
import type { Prisma, CampaignStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Campanhas de Notificação — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

const STATUS_VARIANT: Record<CampaignStatus, 'neutral' | 'info' | 'success' | 'error' | 'warning'> = {
  RASCUNHO: 'neutral',
  ENVIANDO: 'warning',
  ENVIADA: 'success',
  CANCELADA: 'neutral',
  FALHA: 'error',
}

export default async function AdminCampanhasPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const statusFilter = params.status as CampaignStatus | undefined

  const where: Prisma.NotificationCampaignWhereInput = statusFilter ? { status: statusFilter } : {}

  const [campaigns, total] = await Promise.all([
    prisma.notificationCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { rule: { select: { id: true, nome: true } } },
    }),
    prisma.notificationCampaign.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const statusOptions: Array<{ value: '' | CampaignStatus; label: string }> = [
    { value: '', label: 'Todas' },
    { value: 'RASCUNHO', label: 'Rascunho' },
    { value: 'ENVIANDO', label: 'Enviando' },
    { value: 'ENVIADA', label: 'Enviadas' },
    { value: 'CANCELADA', label: 'Canceladas' },
    { value: 'FALHA', label: 'Com falha' },
  ]

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <Link
              href="/admin/notificacoes"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              ← Notificações
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Campanhas</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{total} campanha(s)</p>
          </div>
          <Button href="/admin/notificacoes/campanhas/nova" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Campanha</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/notificacoes/campanhas?status=${opt.value}` : '/admin/notificacoes/campanhas'}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              (statusFilter ?? '') === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconChatBubble className="h-8 w-8 text-slate-400" />}
            title="Nenhuma campanha"
            description="Crie a primeira campanha de notificação."
            action={{ label: 'Nova Campanha', href: '/admin/notificacoes/campanhas/nova' }}
          />
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Entregas</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Criada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{c.titulo}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{c.assunto}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.tipo === 'MANUAL' ? (
                          <Badge variant="neutral">Manual</Badge>
                        ) : (
                          <Badge variant="info">Regra: {c.rule?.nome ?? '—'}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {c.totalEnviado} / {c.totalAlvo}
                        {c.totalErro > 0 && (
                          <span className="ml-1 text-red-600">({c.totalErro} erros)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {new Date(c.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/notificacoes/campanhas/${c.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={statusFilter ? `/admin/notificacoes/campanhas?status=${statusFilter}` : '/admin/notificacoes/campanhas'}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
