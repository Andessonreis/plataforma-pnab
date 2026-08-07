import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Pagination, EmptyState, FilterTabs, IconChatBubble } from '@/components/ui'
import { MarkAllReadButton } from './mark-all-read-button'
import { NotificationItem } from './notification-item'
import { TourButton } from '../tour-button'
import { PASSOS_NOTIFICACOES } from './notificacoes-tour-steps'
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
  const activeFilterKey = lidaFilter ?? ''

  const filterTabs = [
    { key: '', label: 'Todas', href: '/proponente/notificacoes' },
    {
      key: 'false',
      label: totalUnread > 0 ? `Não lidas (${totalUnread})` : 'Não lidas',
      href: '/proponente/notificacoes?lida=false',
    },
    { key: 'true', label: 'Lidas', href: '/proponente/notificacoes?lida=true' },
  ]

  const emptyState =
    activeFilterKey === 'false'
      ? { title: 'Tudo em dia', description: 'Você não tem notificações não lidas.' }
      : activeFilterKey === 'true'
        ? {
            title: 'Nenhuma notificação lida',
            description: 'As notificações que você marcar como lida aparecem aqui.',
          }
        : { title: 'Nenhuma notificação', description: 'Você ainda não recebeu nenhuma notificação.' }

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-5 sm:mb-8">
        <div id="tour-notificacoes-header" className="min-w-0">
          <h1 className="titulo text-3xl text-tinta-950 sm:text-4xl">Notificações</h1>
          <p className="mt-1 text-sm text-tinta-700/70">
            {totalUnread > 0
              ? `${totalUnread} não lida${totalUnread > 1 ? 's' : ''} de ${total} no total`
              : `${total} ${total === 1 ? 'notificação' : 'notificações'} no total`}
          </p>
          <TourButton passos={PASSOS_NOTIFICACOES} className="mt-3" />
        </div>
        {totalUnread > 0 && <MarkAllReadButton />}
      </div>

      <div id="tour-notificacoes-filtros" className="mb-4 sm:mb-6">
        <FilterTabs tabs={filterTabs} activeKey={activeFilterKey} ariaLabel="Filtrar notificações" />
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconChatBubble className="h-8 w-8 text-slate-400" />}
            title={emptyState.title}
            description={emptyState.description}
          />
        </Card>
      ) : (
        <>
          <Card id="tour-notificacoes-lista" padding="sm">
            <ul className="-mx-4 divide-y divide-tinta-900/10">
              {items.map((n, index) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  titulo={n.titulo}
                  corpo={n.corpo}
                  link={n.link}
                  ctaLabel={n.ctaLabel}
                  lidaEm={n.lidaEm?.toISOString() ?? null}
                  createdAt={n.createdAt.toISOString()}
                  destaqueTour={index === 0}
                />
              ))}
            </ul>
          </Card>

          <div id="tour-notificacoes-paginacao">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl={baseUrl}
              className="mt-4 sm:mt-6"
            />
          </div>
        </>
      )}
    </section>
  )
}
