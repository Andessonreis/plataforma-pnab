import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, FadeIn, EmptyState, IconChatBubble } from '@/components/ui'
import { MarkAllReadButton } from './mark-all-read-button'
import { NotificationItem } from './notification-item'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minhas Notificações — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; lida?: string }>
}

export default async function ProponenteNotificacoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const lidaFilter = params.lida

  const where: Prisma.NotificationWhereInput = { userId: session.user.id }
  if (lidaFilter === 'true') where.lidaEm = { not: null }
  if (lidaFilter === 'false') where.lidaEm = null

  const [items, total, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: session.user.id, lidaEm: null } }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const baseUrl = lidaFilter ? `/proponente/notificacoes?lida=${lidaFilter}` : '/proponente/notificacoes'

  const filterOptions = [
    { value: '', label: 'Todas' },
    { value: 'false', label: 'Não lidas' },
    { value: 'true', label: 'Lidas' },
  ]

  return (
    <section>
      <FadeIn>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Notificações</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {totalUnread > 0
                ? `${totalUnread} não lida(s) de ${total} total`
                : `${total} notificação(ões) no total`}
            </p>
          </div>
          {totalUnread > 0 && <MarkAllReadButton />}
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/proponente/notificacoes?lida=${opt.value}` : '/proponente/notificacoes'}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center gap-1',
              (lidaFilter ?? '') === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {opt.label}
            {opt.value === 'false' && totalUnread > 0 && (
              <Badge variant={(lidaFilter ?? '') === opt.value ? 'neutral' : 'info'}>
                {totalUnread}
              </Badge>
            )}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconChatBubble className="h-8 w-8 text-slate-400" />}
            title={lidaFilter === 'false' ? 'Tudo em dia' : 'Nenhuma notificação'}
            description={
              lidaFilter === 'false'
                ? 'Você não tem notificações não lidas.'
                : 'Você ainda não recebeu nenhuma notificação.'
            }
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-2 sm:space-y-3">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                titulo={n.titulo}
                corpo={n.corpo}
                link={n.link}
                ctaLabel={n.ctaLabel}
                lidaEm={n.lidaEm?.toISOString() ?? null}
                createdAt={n.createdAt.toISOString()}
              />
            ))}
          </ul>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
