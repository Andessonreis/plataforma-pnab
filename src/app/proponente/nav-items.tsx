import type { ReactNode } from 'react'
import { IconHome, IconClipboard, IconChatBubble, IconUser } from '@/components/ui'

export interface NavItem {
  /** Id estável do link — usado como âncora do tour guiado (tour-nav-<id>). */
  id: string
  label: string
  href: string
  icon: ReactNode
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/proponente',
    icon: <IconHome className="h-5 w-5" />,
  },
  {
    id: 'inscricoes',
    label: 'Minhas Inscrições',
    href: '/proponente/inscricoes',
    icon: <IconClipboard className="h-5 w-5" />,
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    href: '/proponente/notificacoes',
    icon: <IconChatBubble className="h-5 w-5" />,
  },
  {
    id: 'perfil',
    label: 'Meu Perfil',
    href: '/proponente/perfil',
    icon: <IconUser className="h-5 w-5" />,
  },
]

/** Dashboard só ativa em match exato; as demais seções ativam por prefixo (ex.: /proponente/inscricoes/123). */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/proponente') return pathname === '/proponente'
  return pathname.startsWith(href)
}
