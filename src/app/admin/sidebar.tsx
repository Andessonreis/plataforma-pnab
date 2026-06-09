'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { LogoutButton } from '@client/components/logout-button'
import {
  IconHome,
  IconNews,
  IconDocument,
  IconClipboard,
  IconCheck,
  IconQuestion,
  IconUsers,
  IconInfo,
  IconClose,
  IconTicket,
  IconStar,
  IconChatBubble,
  IconSlides,
  IconSettings,
  IconMail,
  IconShield,
  UserAvatar,
} from '@client/components/ui'

interface AdminSidebarProps {
  userName: string
  userRole: UserRole
  roleLabel: string
  userAvatarUrl?: string | null
  /** Inscrições aguardando habilitação em editais ativos — destaca o item no menu */
  habilitacaoPendentes?: number
  /** Inscrições ainda não avaliadas por completo na fase de avaliação — alimenta o badge */
  avaliacaoPendentes?: number
  /** Há edital na fase de avaliação — destaca o item mesmo sem pendências */
  avaliacaoEmAndamento?: boolean
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: UserRole[]
  /** Identificador opcional para tratamento visual especial (destaque, badge) */
  highlightKey?: 'habilitacao' | 'avaliacao'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Gestão',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        roles: ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR'],
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
        roles: ['ADMIN', 'HABILITADOR', 'ATENDIMENTO'],
        icon: <IconClipboard className="h-5 w-5" />,
      },
      {
        label: 'Habilitação',
        href: '/admin/habilitacao',
        roles: ['ADMIN'],
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

export function AdminSidebar({
  userName,
  userRole,
  roleLabel,
  userAvatarUrl,
  habilitacaoPendentes = 0,
  avaliacaoPendentes = 0,
  avaliacaoEmAndamento = false,
}: AdminSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  /** Destaque visual do item (sem depender de badge numérico). */
  function isHighlighted(item: NavItem): boolean {
    if (item.highlightKey === 'habilitacao') return habilitacaoPendentes > 0
    if (item.highlightKey === 'avaliacao') return avaliacaoEmAndamento
    return false
  }

  /** Contador opcional exibido no item. */
  function badgeCount(item: NavItem): number | null {
    if (item.highlightKey === 'habilitacao' && habilitacaoPendentes > 0) return habilitacaoPendentes
    if (item.highlightKey === 'avaliacao' && avaliacaoPendentes > 0) return avaliacaoPendentes
    return null
  }

  return (
    <>
      <input type="checkbox" id="admin-sidebar-toggle" className="peer hidden" aria-hidden="true" />

      {/* Overlay mobile */}
      <label
        htmlFor="admin-sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:!hidden"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        {/* Faixa topo */}
        <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600 shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PNAB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Backoffice</p>
            <p className="text-xs text-slate-400 truncate">{userName} — {roleLabel}</p>
          </div>
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <IconClose className="h-5 w-5" />
          </label>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide" aria-label="Menu administrativo">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(userRole))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.href)
                    const count = badgeCount(item)
                    const hasHighlight = isHighlighted(item) && !active

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px]',
                          active
                            ? 'bg-white/10 text-white border-l-2 border-brand-400'
                            : hasHighlight
                            ? 'text-amber-100 bg-amber-500/10 hover:bg-amber-500/15 ring-1 ring-inset ring-amber-500/30'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                        ].join(' ')}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className={hasHighlight ? 'text-amber-300' : undefined}>{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {count !== null && (
                          <span
                            className={[
                              'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums',
                              active
                                ? 'bg-white text-slate-900'
                                : 'bg-amber-400 text-amber-950',
                            ].join(' ')}
                            aria-label={`${count} ${count === 1 ? 'pendência' : 'pendências'}`}
                          >
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Rodapé — usuário + sair */}
        <div className="border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <UserAvatar nome={userName} src={userAvatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            </div>
          </div>
          <div className="px-3 pb-4">
            <LogoutButton
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150 min-h-[44px]"
            />
          </div>
        </div>
      </aside>
    </>
  )
}
