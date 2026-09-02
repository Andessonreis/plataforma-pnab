import Link from 'next/link'
import { Badge, EmptyState, IconTicket } from '@/components/ui'

export interface AtendimentoTicket {
  id: string
  protocolo: string
  assunto: string
  nomeContato: string
  emailContato: string
  status: string
  createdAt: Date
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

function statusBadge(status: string): BadgeVariant {
  if (status === 'ABERTO') return 'warning'
  if (status === 'EM_ATENDIMENTO') return 'info'
  if (status === 'FECHADO') return 'success'
  return 'neutral'
}

function statusLabel(status: string) {
  if (status === 'ABERTO') return 'Aberto'
  if (status === 'EM_ATENDIMENTO') return 'Em Atendimento'
  if (status === 'FECHADO') return 'Fechado'
  return status
}

function ListaVazia() {
  return (
    <EmptyState
      icon={<IconTicket className="h-8 w-8 text-tinta-400" />}
      title="Nenhum atendimento pendente"
      description="Todos os atendimentos estão em dia."
    />
  )
}

function ListaMobile({ tickets }: { tickets: AtendimentoTicket[] }) {
  return (
    <div className="sm:hidden divide-y divide-papel-200 -mx-4">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/admin/atendimentos/${ticket.id}`}
          className="flex items-start gap-3 px-4 py-3 hover:bg-turquesa-50/60 transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-turquesa-50 flex items-center justify-center shrink-0 mt-0.5">
            <IconTicket className="h-4 w-4 text-turquesa-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs font-mono text-tinta-700/40">{ticket.protocolo}</p>
              <Badge variant={statusBadge(ticket.status)}>{statusLabel(ticket.status)}</Badge>
            </div>
            <p className="text-sm font-medium text-tinta-950 truncate">{ticket.assunto}</p>
            <p className="text-xs text-tinta-700/50 truncate">{ticket.nomeContato}</p>
          </div>
          <span className="text-[10px] text-tinta-700/40 shrink-0 tabular-nums mt-1">
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}
          </span>
        </Link>
      ))}
    </div>
  )
}

function ListaDesktop({ tickets }: { tickets: AtendimentoTicket[] }) {
  return (
    <div className="hidden sm:block divide-y divide-papel-200">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/admin/atendimentos/${ticket.id}`}
          className="flex items-center gap-3 py-3 hover:bg-turquesa-50/40 transition-colors rounded-lg px-2 -mx-2"
        >
          <div className="h-8 w-8 rounded-lg bg-turquesa-50 flex items-center justify-center shrink-0">
            <IconTicket className="h-4 w-4 text-turquesa-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-tinta-950 truncate">{ticket.assunto}</p>
            <p className="text-xs text-tinta-700/50 truncate">{ticket.nomeContato} · {ticket.emailContato}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={statusBadge(ticket.status)}>{statusLabel(ticket.status)}</Badge>
            <span className="text-xs font-mono text-tinta-700/40">{ticket.protocolo}</span>
            <span className="text-xs text-tinta-700/40 tabular-nums">
              {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'America/Sao_Paulo' })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function ListaTickets({ tickets }: { tickets: AtendimentoTicket[] }) {
  if (tickets.length === 0) return <ListaVazia />
  return (
    <>
      <ListaMobile tickets={tickets} />
      <ListaDesktop tickets={tickets} />
    </>
  )
}
