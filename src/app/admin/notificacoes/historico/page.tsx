import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, FadeIn, EmptyState, IconChatBubble } from '@/components/ui'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Histórico de Notificações — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; lida?: string; userId?: string }>
}

export default async function AdminHistoricoPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 30
  const lidaFilter = params.lida
  const userIdFilter = params.userId

  const where: Prisma.NotificationWhereInput = {}
  if (userIdFilter) where.userId = userIdFilter
  if (lidaFilter === 'true') where.lidaEm = { not: null }
  if (lidaFilter === 'false') where.lidaEm = null

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, nome: true, email: true } },
        campaign: { select: { id: true, titulo: true, tipo: true } },
      },
    }),
    prisma.notification.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const baseUrl = lidaFilter
    ? `/admin/notificacoes/historico?lida=${lidaFilter}`
    : '/admin/notificacoes/historico'

  const filterOptions = [
    { value: '', label: 'Todas' },
    { value: 'false', label: 'Não lidas' },
    { value: 'true', label: 'Lidas' },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/notificacoes"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            ← Notificações
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Histórico</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{total} entrega(s)</p>
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/notificacoes/historico?lida=${opt.value}` : '/admin/notificacoes/historico'}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              (lidaFilter ?? '') === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconChatBubble className="h-8 w-8 text-slate-400" />}
            title="Nenhuma notificação"
            description="O histórico aparece aqui quando campanhas começarem a ser entregues."
          />
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Destinatário</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Mensagem</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Canais</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((n) => (
                    <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-slate-900">{n.user.nome}</p>
                        <p className="text-[11px] text-slate-500">{n.user.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-slate-900 line-clamp-1">{n.titulo}</p>
                        {n.campaign && (
                          <p className="text-[11px] text-slate-500">
                            Campanha: {n.campaign.titulo}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {n.canais.map((c) => (
                            <Badge key={c} variant="neutral">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <Badge variant={n.lidaEm ? 'success' : 'neutral'}>
                          {n.lidaEm ? 'Lida' : 'Não lida'}
                        </Badge>
                        {n.emailErro && (
                          <p className="text-[10px] text-red-600 mt-1">Email: {n.emailErro}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {new Date(n.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-4 sm:mt-6" />
        </>
      )}
    </section>
  )
}
