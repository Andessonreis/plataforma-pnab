import type { ReactNode } from 'react'
import type { UserRole } from '@prisma/client'
import {
  IconHome,
  IconNews,
  IconDocument,
  IconClipboard,
  IconCheck,
  IconQuestion,
  IconUsers,
  IconInfo,
  IconTicket,
  IconStar,
  IconChatBubble,
  IconSlides,
  IconSettings,
  IconMail,
  IconShield,
} from '@/components/ui'

export interface NavItem {
  label: string
  href: string
  icon: ReactNode
  roles: UserRole[]
  /** Identificador opcional para tratamento visual especial (destaque, badge). */
  highlightKey?: 'habilitacao' | 'avaliacao'
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: 'Gestão',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        roles: ['ADMIN', 'ATENDIMENTO', 'AVALIADOR'],
        icon: <IconHome className="h-5 w-5" />,
      },
      {
        label: 'Editais',
        href: '/admin/editais',
        roles: ['ADMIN'],
        icon: <IconNews className="h-5 w-5" />,
      },
      {
        label: 'Inscrições',
        href: '/admin/inscricoes',
        roles: ['ADMIN', 'ATENDIMENTO'],
        icon: <IconClipboard className="h-5 w-5" />,
      },
      {
        // Único item de menu do Habilitador — a tela dele é a seleção de
        // edital + fila de conferência, não um dashboard genérico nem a
        // lista bruta de inscrições.
        label: 'Habilitação',
        href: '/admin/habilitacao',
        roles: ['ADMIN', 'HABILITADOR'],
        icon: <IconShield className="h-5 w-5" />,
        highlightKey: 'habilitacao',
      },
      {
        label: 'Avaliação',
        href: '/admin/avaliacao',
        roles: ['ADMIN'],
        icon: <IconStar className="h-5 w-5" />,
        highlightKey: 'avaliacao',
      },
      {
        label: 'Minhas Avaliações',
        href: '/admin/inscricoes',
        roles: ['AVALIADOR'],
        icon: <IconStar className="h-5 w-5" />,
      },
      {
        label: 'Contemplados',
        href: '/admin/contemplados',
        roles: ['ADMIN'],
        icon: <IconCheck className="h-5 w-5" />,
      },
      {
        label: 'Recursos',
        href: '/admin/recursos',
        roles: ['ADMIN'],
        icon: <IconChatBubble className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Atendimento',
    items: [
      {
        label: 'Atendimentos',
        href: '/admin/atendimentos',
        roles: ['ADMIN', 'ATENDIMENTO'],
        icon: <IconTicket className="h-5 w-5" />,
      },
      {
        label: 'FAQ',
        href: '/admin/faq',
        roles: ['ADMIN', 'ATENDIMENTO'],
        icon: <IconQuestion className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      {
        label: 'Notícias',
        href: '/admin/noticias',
        roles: ['ADMIN'],
        icon: <IconNews className="h-5 w-5" />,
      },
      {
        label: 'Páginas',
        href: '/admin/cms',
        roles: ['ADMIN'],
        icon: <IconDocument className="h-5 w-5" />,
      },
      {
        label: 'Slide Carrossel',
        href: '/admin/slides',
        roles: ['ADMIN'],
        icon: <IconSlides className="h-5 w-5" />,
      },
      {
        label: 'Banner Topo',
        href: '/admin/banners',
        roles: ['ADMIN'],
        icon: <IconInfo className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Comunicação',
    items: [
      {
        label: 'Notificações',
        href: '/admin/notificacoes',
        roles: ['ADMIN'],
        icon: <IconChatBubble className="h-5 w-5" />,
      },
      {
        label: 'Templates de E-mail',
        href: '/admin/email-templates',
        roles: ['ADMIN'],
        icon: <IconMail className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Usuários',
        href: '/admin/usuarios',
        roles: ['ADMIN'],
        icon: <IconUsers className="h-5 w-5" />,
      },
      {
        label: 'Logs de Auditoria',
        href: '/admin/logs',
        roles: ['ADMIN'],
        icon: <IconInfo className="h-5 w-5" />,
      },
      {
        label: 'Configurações',
        href: '/admin/configuracoes',
        roles: ['ADMIN'],
        icon: <IconSettings className="h-5 w-5" />,
      },
    ],
  },
]

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}
