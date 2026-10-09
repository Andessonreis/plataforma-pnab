import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'
import { SecaoPainel } from './secao-painel'
import { VazioPainel } from './vazio-painel'

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

/** Avisos mais recentes. Não lida ganha marca e peso; lida fica em tom neutro. */
export function RecentNotificationsCard({ notifications, unreadCount }: RecentNotificationsCardProps) {
  return (
    <SecaoPainel
      id="tour-notificacoes"
      titulo="Avisos"
      acao={{ href: '/proponente/notificacoes', rotulo: unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Ver todos' }}
    >
      {notifications.length === 0 ? (
        <VazioPainel
          titulo="Nenhum aviso até agora."
          texto="Mudanças nas suas inscrições e novidades dos editais chegam por aqui e no seu e-mail."
        />
      ) : (
        <ul>
          {notifications.map((n) => {
            const naoLida = !n.lidaEm
            return (
              <li key={n.id} className="border-b border-tinta-900/15 last:border-b-0">
                <Link
                  href={n.link ?? '/proponente/notificacoes'}
                  className="flex min-h-[56px] items-start gap-3 py-3 [@media(hover:hover)]:hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
                >
                  <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 ${naoLida ? 'bg-brand-700' : 'bg-transparent'}`} />
                  <span className="min-w-0">
                    {naoLida && <span className="sr-only">Não lida: </span>}
                    <span className={`block leading-snug ${naoLida ? 'font-bold text-tinta-900' : 'text-tinta-700'}`}>
                      {n.titulo}
                    </span>
                    <span className="block text-sm text-tinta-600">{formatDate(n.createdAt)}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </SecaoPainel>
  )
}
