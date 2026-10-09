import type { ReactNode } from 'react'
import { IconHome, IconClipboard, IconChatBubble, IconUser, IconBook } from '@/components/ui'

export interface NavItem {
  /** Id estável do link, usado como âncora do tour guiado (tour-nav-<id>). */
  id: string
  label: string
  /** Rótulo da barra inferior do celular, onde cada aba tem pouco espaço. */
  curto: string
  href: string
  icon: ReactNode
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', curto: 'Início', href: '/proponente', icon: <IconHome className="h-6 w-6 lg:h-5 lg:w-5" /> },
  {
    id: 'inscricoes',
    label: 'Minhas inscrições',
    curto: 'Inscrições',
    href: '/proponente/inscricoes',
    icon: <IconClipboard className="h-6 w-6 lg:h-5 lg:w-5" />,
  },
  {
    id: 'memorial',
    label: 'Visita ao Memorial',
    curto: 'Memorial',
    href: '/proponente/memorial',
    icon: <IconBook className="h-6 w-6 lg:h-5 lg:w-5" />,
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    curto: 'Avisos',
    href: '/proponente/notificacoes',
    icon: <IconChatBubble className="h-6 w-6 lg:h-5 lg:w-5" />,
  },
  { id: 'perfil', label: 'Meu perfil', curto: 'Perfil', href: '/proponente/perfil', icon: <IconUser className="h-6 w-6 lg:h-5 lg:w-5" /> },
]

/** Atalho do Memorial que só cabe no menu lateral do desktop. */
export const ATALHO_MINHAS_VISITAS = { label: 'Minhas visitas', href: '/proponente/memorial/visitas' }

/** Início só ativa em match exato; as demais seções ativam por prefixo (ex.: /proponente/inscricoes/123). */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/proponente') return pathname === '/proponente'
  return pathname.startsWith(href)
}
