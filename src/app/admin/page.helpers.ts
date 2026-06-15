import { IconUser, IconClipboard, IconNews, IconCheck, IconInfo } from '@client/components/ui'

export type IconComponent = React.ComponentType<{ className?: string }>
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export function getActionStyle(action: string): { Icon: IconComponent; bg: string; color: string; badge: BadgeVariant } {
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('CADASTRO')) {
    return { Icon: IconUser, bg: 'bg-blue-50', color: 'text-blue-600', badge: 'info' }
  }
  if (action.includes('INSCRICAO') || action.includes('ENVIADA')) {
    return { Icon: IconClipboard, bg: 'bg-amber-50', color: 'text-amber-600', badge: 'warning' }
  }
  if (action.includes('EDITAL') || action.includes('PUBLICADO')) {
    return { Icon: IconNews, bg: 'bg-green-50', color: 'text-green-600', badge: 'success' }
  }
  if (action.includes('STATUS') || action.includes('ALTERADO')) {
    return { Icon: IconCheck, bg: 'bg-purple-50', color: 'text-purple-600', badge: 'neutral' }
  }
  return { Icon: IconInfo, bg: 'bg-slate-100', color: 'text-slate-500', badge: 'neutral' }
}

export function atendimentoStatusBadge(status: string): BadgeVariant {
  if (status === 'ABERTO') return 'warning'
  if (status === 'EM_ATENDIMENTO') return 'info'
  if (status === 'FECHADO') return 'success'
  return 'neutral'
}

export function atendimentoStatusLabel(status: string) {
  if (status === 'ABERTO') return 'Aberto'
  if (status === 'EM_ATENDIMENTO') return 'Em Atendimento'
  if (status === 'FECHADO') return 'Fechado'
  return status
}
