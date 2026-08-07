import { Card } from '@/components/ui'
import { DraftInscricoesCard, type DraftInscricao } from './draft-inscricoes-card'
import { RecentNotificationsCard, type RecentNotification } from './recent-notifications-card'

interface DashboardSidebarProps {
  drafts: DraftInscricao[]
  draftCount: number
  notifications: RecentNotification[]
  unreadCount: number
}

// Rascunhos e notificações lado a lado, 2 cartões distintos — não mais
// empilhados numa coluna estreita junto de prazos (que agora mora no hero).
export function DashboardSidebar({ drafts, draftCount, notifications, unreadCount }: DashboardSidebarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <Card id="tour-rascunhos" padding="sm" className="sm:p-6">
        <DraftInscricoesCard drafts={drafts} totalDrafts={draftCount} />
      </Card>

      <Card id="tour-notificacoes" padding="sm" className="sm:p-6">
        <RecentNotificationsCard notifications={notifications} unreadCount={unreadCount} />
      </Card>
    </div>
  )
}
