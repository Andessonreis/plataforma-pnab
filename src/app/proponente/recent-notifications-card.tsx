import Link from 'next/link'
import { IconChatBubble } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'

export interface RecentNotification {
  id: string
  titulo: string
  link: string | null
  lidaEm: Date | null
  createdAt: Date
}

interface RecentNotificationsCardProps {
  notifications: RecentNotification[]
  unreadCount: number
}

// Lista compacta de notificações — sem cartão próprio, pra ser empilhada dentro do
// painel lateral do dashboard (DashboardSidebar) junto de rascunhos e prazos.
export function RecentNotificationsCard({ notifications, unreadCount }: RecentNotificationsCardProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="titulo text-lg text-tinta-950">Notificações</h3>
        <Link href="/proponente/notificacoes" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          Ver todas
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <IconChatBubble className="h-6 w-6 text-slate-500" />
          <p className="mt-2 text-sm text-slate-500">Nenhuma notificação por aqui.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {notifications.map((n) => {
            const naoLida = !n.lidaEm
            return (
              <li key={n.id}>
                <Link
                  href={n.link ?? '/proponente/notificacoes'}
                  className="flex items-start gap-2 rounded-lg px-2.5 py-2 -mx-2.5 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <span
                    aria-hidden="true"
                    // deslop-ignore-next-line 19 — dot de não-lida: exceção explícita do guia de estilo (raio total permitido em badge/avatar/dot)
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${naoLida ? 'bg-brand-600' : 'bg-transparent'}`}
                  />
                  <div className="min-w-0">
                    <p className={`text-sm leading-snug truncate ${naoLida ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                      {n.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {unreadCount > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{unreadCount} não lida(s)</p>
      )}
    </div>
  )
}
