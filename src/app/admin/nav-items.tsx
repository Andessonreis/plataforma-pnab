import type { ReactNode } from 'react'
import type { UserRole } from '@prisma/client'
import { ROLES_MEMORIAL_COMPLETO } from '@/lib/memorial/acesso'
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
  IconInstagram,
  IconCalendar,
  IconBook,
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
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDIMENTO', 'AVALIADOR'],
        icon: <IconHome className="h-5 w-5" />,
      },
      {
        label: 'Editais',
        href: '/admin/editais',
        roles: ['ADMIN', 'SUPER_ADMIN'],
        icon: <IconNews className="h-5 w-5" />,
      },
      {
        label: 'Inscrições',
        href: '/admin/inscricoes',
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDIMENTO'],
        icon: <IconClipboard className="h-5 w-5" />,
      },
      {
        label: 'Habilitação',
        href: '/admin/habilitacao',
        roles: ['SUPER_ADMIN', 'HABILITADOR', 'ADMIN'],
        icon: <IconShield className="h-5 w-5" />,
        highlightKey: 'habilitacao',
      },
      {
        label: 'Avaliação',
        href: '/admin/avaliacao',
        roles: ['ADMIN', 'SUPER_ADMIN'],
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
        roles: ['ADMIN', 'SUPER_ADMIN'],
        icon: <IconCheck className="h-5 w-5" />,
      },
      {
        label: 'Recursos',
        href: '/admin/recursos',
        roles: ['ADMIN', 'SUPER_ADMIN'],
        icon: <IconChatBubble className="h-5 w-5" />,
      },
      {
        label: 'Agentes Culturais',
        href: '/admin/agentes',
        roles: ['ADMIN', 'SUPER_ADMIN'],
        icon: <IconUsers className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Atendimento',
    items: [
      {
        label: 'Atendimentos',
        href: '/admin/atendimentos',
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDIMENTO'],
        icon: <IconTicket className="h-5 w-5" />,
      },
      {
        label: 'FAQ',
        href: '/admin/faq',
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDIMENTO'],
        icon: <IconQuestion className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Memorial',
    items: [
      {
        label: 'Painel do Memorial',
        href: '/admin/memorial',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconHome className="h-5 w-5" />,
      },
      {
        label: 'Agendamentos',
        href: '/admin/memorial/agendamentos',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconCalendar className="h-5 w-5" />,
      },
      {
        label: 'Exposições',
        href: '/admin/memorial/exposicoes',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconSlides className="h-5 w-5" />,
      },
      {
        label: 'Acervo e fotos',
        href: '/admin/memorial/acervo',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconBook className="h-5 w-5" />,
      },
      {
        label: 'Pessoas e eventos',
        href: '/admin/memorial/pessoas',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconUsers className="h-5 w-5" />,
      },
      {
        label: 'Questionários',
        href: '/admin/memorial/questionarios',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconClipboard className="h-5 w-5" />,
      },
      {
        label: 'Textos e regras',
        href: '/admin/memorial/configuracoes',
        roles: ROLES_MEMORIAL_COMPLETO,
        icon: <IconSettings className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      {
        label: 'Notícias',
        href: '/admin/noticias',
        roles: ['SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconNews className="h-5 w-5" />,
      },
      {
        label: 'Páginas',
        href: '/admin/cms',
        roles: ['SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconDocument className="h-5 w-5" />,
      },
      {
        label: 'Slide Carrossel',
        href: '/admin/slides',
        roles: ['SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconSlides className="h-5 w-5" />,
      },
      {
        label: 'Banner Topo',
        href: '/admin/banners',
        roles: ['SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconInfo className="h-5 w-5" />,
      },
      {
        label: 'Dia a Dia',
        href: '/admin/momentos',
        roles: ['SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconInstagram className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Comunicação',
    items: [
      {
        label: 'Notificações',
        href: '/admin/notificacoes',
        roles: ['ADMIN', 'SUPER_ADMIN', 'COMUNICACAO'],
        icon: <IconChatBubble className="h-5 w-5" />,
      },
      {
        label: 'Templates de E-mail',
        href: '/admin/email-templates',
        roles: ['ADMIN', 'SUPER_ADMIN', 'COMUNICACAO'],
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
        roles: ['SUPER_ADMIN'],
        icon: <IconUsers className="h-5 w-5" />,
      },
      {
        label: 'Ver como avaliador',
        href: '/avaliador/espelho',
        roles: ['SUPER_ADMIN'],
        icon: <IconStar className="h-5 w-5" />,
      },
      {
        label: 'Ver como habilitador',
        href: '/admin/habilitacao/espelho',
        roles: ['SUPER_ADMIN'],
        icon: <IconShield className="h-5 w-5" />,
      },
      {
        label: 'Logs de Auditoria',
        href: '/admin/logs',
        roles: ['SUPER_ADMIN'],
        icon: <IconInfo className="h-5 w-5" />,
      },
      {
        label: 'Configurações',
        href: '/admin/configuracoes',
        roles: ['SUPER_ADMIN'],
        icon: <IconSettings className="h-5 w-5" />,
      },
    ],
  },
]

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}
