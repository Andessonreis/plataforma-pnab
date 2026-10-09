import { IconBook, IconCalendar, IconClipboard, IconHome, IconSettings, IconSlides, IconUsers } from '@/components/ui'
import { ROLES_MEMORIAL_COMPLETO } from '@/lib/memorial/acesso'
import type { NavSection } from './nav-items'

/** Grupo do Memorial no menu lateral: tudo da equipe numa pasta que abre e fecha. */
export const memorialSection: NavSection = {
  title: 'Memorial',
  icon: <IconBook className="h-5 w-5" />,
  items: [
    {
      label: 'Visão geral',
      href: '/admin/memorial',
      exact: true,
      roles: ROLES_MEMORIAL_COMPLETO,
      icon: <IconHome className="h-5 w-5" />,
    },
    {
      label: 'Agendamentos',
      href: '/admin/memorial/agendamentos',
      highlightKey: 'memorial',
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
}
