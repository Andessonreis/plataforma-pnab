import { Badge, EmptyState, IconInfo, IconUser, IconClipboard, IconNews, IconCheck } from '@/components/ui'

export interface AuditLogEntry {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  createdAt: Date
  user: { nome: string } | null
}

type IconComponent = React.ComponentType<{ className?: string }>
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

function getActionStyle(action: string): { Icon: IconComponent; bg: string; color: string; badge: BadgeVariant } {
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('CADASTRO')) {
    return { Icon: IconUser, bg: 'bg-blue-50', color: 'text-blue-600', badge: 'info' }
  }
  if (action.includes('INSCRICAO') || action.includes('ENVIADA')) {
    return { Icon: IconClipboard, bg: 'bg-accent-50', color: 'text-accent-600', badge: 'warning' }
  }
  if (action.includes('EDITAL') || action.includes('PUBLICADO')) {
    return { Icon: IconNews, bg: 'bg-emerald-50', color: 'text-emerald-600', badge: 'success' }
  }
  if (action.includes('STATUS') || action.includes('ALTERADO')) {
    return { Icon: IconCheck, bg: 'bg-ameixa-50', color: 'text-ameixa-600', badge: 'neutral' }
  }
  return { Icon: IconInfo, bg: 'bg-papel-100', color: 'text-tinta-500', badge: 'neutral' }
}

export function AtividadeRecente({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<IconInfo className="h-8 w-8 text-tinta-400" />}
        title="Nenhuma atividade registrada"
        description="As ações realizadas no sistema aparecerão aqui."
      />
    )
  }

  return (
    <div className="divide-y divide-papel-200 -mx-1 sm:mx-0">
      {logs.map((log) => {
        const actionStyle = getActionStyle(log.action)
        return (
          <div key={log.id} className="flex items-start gap-2.5 sm:gap-3 px-1 sm:px-3 py-2.5 sm:py-3.5 hover:bg-papel-100/50 transition-colors first:pt-0 last:pb-0">
            <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${actionStyle.bg}`}>
              <actionStyle.Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${actionStyle.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs sm:text-sm text-tinta-800 truncate">
                  <span className="font-medium">{log.user?.nome?.split(' ').slice(0, 2).join(' ') ?? 'Sistema'}</span>
                </p>
                <span className="text-[10px] sm:text-xs text-tinta-700/40 shrink-0 tabular-nums">
                  {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={actionStyle.badge}>{log.action.replace(/_/g, ' ')}</Badge>
                {log.entity && (
                  <span className="text-[10px] sm:text-xs text-tinta-700/40 truncate">
                    {log.entity} #{log.entityId?.slice(0, 6)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
