import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { UserRole, TicketStatus } from '@prisma/client'
import {
  Card,
  Badge,
  Pagination,
  EmptyState,
  FadeIn,
  IconTicket,
  IconClock,
  IconCheck,
  IconChatBubble,
} from '@/components/ui'

export const metadata: Metadata = {
  title: 'Tickets de Atendimento — Portal PNAB Irecê',
}

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO']

const STATUS_LABELS: Record<TicketStatus, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  FECHADO: 'Fechado',
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const STATUS_BADGE: Record<TicketStatus, BadgeVariant> = {
  ABERTO: 'warning',
  EM_ATENDIMENTO: 'info',
  FECHADO: 'success',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminTicketsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const statusFilter = params.status as TicketStatus | undefined

  const where = statusFilter ? { status: statusFilter } : {}

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [
        // Prioridade: ABERTO > EM_ATENDIMENTO > FECHADO, depois por data
        { createdAt: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  // Contadores por status para os filtros
  const [countAberto, countEmAtendimento, countFechado] = await Promise.all([
    prisma.ticket.count({ where: { status: 'ABERTO' } }),
    prisma.ticket.count({ where: { status: 'EM_ATENDIMENTO' } }),
    prisma.ticket.count({ where: { status: 'FECHADO' } }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const filterOptions = [
    {
      value: '',
      label: 'Todos',
      count: countAberto + countEmAtendimento + countFechado,
      icon: <IconTicket className="h-3.5 w-3.5" />,
    },
    {
      value: 'ABERTO',
      label: 'Abertos',
      count: countAberto,
      icon: <IconClock className="h-3.5 w-3.5" />,
    },
    {
      value: 'EM_ATENDIMENTO',
      label: 'Em Andamento',
      count: countEmAtendimento,
      icon: <IconChatBubble className="h-3.5 w-3.5" />,
    },
    {
      value: 'FECHADO',
      label: 'Fechados',
      count: countFechado,
      icon: <IconCheck className="h-3.5 w-3.5" />,
    },
  ]

  const baseUrl = statusFilter ? `/admin/tickets?status=${statusFilter}` : '/admin/tickets'

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tickets de Atendimento</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
            {total} ticket(s) {statusFilter ? `com status "${STATUS_LABELS[statusFilter]}"` : 'no total'}
          </p>
        </div>
      </FadeIn>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6" role="group" aria-label="Filtrar por status">
        {filterOptions.map((opt) => {
          const isActive = (statusFilter ?? '') === opt.value
          return (
            <Link
              key={opt.value}
              href={opt.value ? `/admin/tickets?status=${opt.value}` : '/admin/tickets'}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {opt.icon}
              {opt.label}
              <span
                className={[
                  'inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600',
                ].join(' ')}
              >
                {opt.count}
              </span>
            </Link>
          )
        })}
      </div>

      {tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTicket className="h-8 w-8 text-slate-400" />}
            title="Nenhum ticket encontrado"
            description={
              statusFilter
                ? `Não há tickets com status "${STATUS_LABELS[statusFilter]}".`
                : 'Nenhum ticket de atendimento registrado ainda.'
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-2">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                <div
                  className={[
                    'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    ticket.status === 'ABERTO'
                      ? 'bg-amber-50'
                      : ticket.status === 'EM_ATENDIMENTO'
                        ? 'bg-blue-50'
                        : 'bg-green-50',
                  ].join(' ')}
                >
                  <IconTicket
                    className={[
                      'h-4 w-4',
                      ticket.status === 'ABERTO'
                        ? 'text-amber-500'
                        : ticket.status === 'EM_ATENDIMENTO'
                          ? 'text-blue-500'
                          : 'text-green-500',
                    ].join(' ')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={STATUS_BADGE[ticket.status]}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {ticket.protocolo}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-1">
                    {ticket.assunto}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{ticket.nomeContato}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums mt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop: tabela */}
          <Card padding="sm" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Protocolo</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Assunto</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Contato</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-slate-500">{ticket.protocolo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 line-clamp-1 max-w-xs">
                          {ticket.assunto}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {ticket.mensagem.slice(0, 80)}
                          {ticket.mensagem.length > 80 ? '…' : ''}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-800">{ticket.nomeContato}</p>
                        <p className="text-xs text-slate-500">{ticket.emailContato}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={STATUS_BADGE[ticket.status]}>
                          {STATUS_LABELS[ticket.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs min-h-[44px] inline-flex items-center"
                        >
                          Atender
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
            baseUrl={baseUrl}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
