import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { AdminSidebar } from './sidebar'
import { getRoleTheme } from './role-theme'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { prisma } from '@/lib/db'
import { IconMenu, UserAvatar } from '@/components/ui'
import { NotificationBell } from '@/components/layout'
import { variaveisDeFonte } from '../fontes'

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR']

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDIMENTO: 'Atendimento',
  HABILITADOR: 'Habilitador',
  AVALIADOR: 'Avaliador',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  if (!ROLES_PERMITIDOS.includes(role)) redirect('/')

  const theme = getRoleTheme(role)

  // Carrega avatarUrl (não está na session). Hit leve no DB pelo layout.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })
  const nome = session.user.name ?? 'Usuário'
  const avatarUrl = user?.avatarUrl ?? null

  // Pendências da fase de habilitação — alimenta o destaque do menu.
  // ADMIN vê todos os editais; HABILITADOR só os que a equipe dele atende.
  const habilitacaoPendentes = await (async () => {
    if (role === 'ADMIN') {
      return prisma.inscricao.count({
        where: { status: 'ENVIADA', edital: { status: 'HABILITACAO' } },
      })
    }
    if (role === 'HABILITADOR') {
      const visiveis = await getEditaisVisiveis(session.user.id, 'HABILITADOR')
      return prisma.inscricao.count({
        where: {
          status: 'ENVIADA',
          edital: { status: 'HABILITACAO' },
          ...(visiveis ? { editalId: { in: visiveis } } : {}),
        },
      })
    }
    return 0
  })()

  // Avaliação em andamento — destaca o menu enquanto houver edital na fase de
  // avaliação; o badge mostra as inscrições ainda não avaliadas por completo.
  const [editaisEmAvaliacao, avaliacaoPendentes] =
    role === 'ADMIN'
      ? await Promise.all([
          prisma.edital.count({ where: { status: 'AVALIACAO' } }),
          prisma.inscricao.count({
            where: {
              edital: { status: 'AVALIACAO' },
              status: { in: ['HABILITADA', 'EM_AVALIACAO'] },
              OR: [
                { avaliacoes: { none: {} } },
                { avaliacoes: { some: { finalizada: false } } },
              ],
            },
          }),
        ])
      : [0, 0]

  return (
    // .tema-secult resolve --brand-*/--accent-* pra cor real da identidade
    // SECULT (terracota/dourado); sem ela o backoffice caía no verde/âmbar
    // genérico de fallback do Tailwind — a origem do "cara de SaaS pronto".
    <div className={`tema-secult font-questrial flex min-h-screen bg-papel-50 ${variaveisDeFonte}`}>
      <AdminSidebar
        userName={nome}
        userRole={role}
        roleLabel={roleLabels[role] ?? role}
        userAvatarUrl={avatarUrl}
        habilitacaoPendentes={habilitacaoPendentes}
        avaliacaoPendentes={avaliacaoPendentes}
        avaliacaoEmAndamento={editaisEmAvaliacao > 0}
      />

      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Barra superior */}
        <header className="lg:sticky lg:top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b border-tinta-900/10 shadow-sm px-4 py-2 lg:px-6 lg:py-3">
          <label
            htmlFor="admin-sidebar-toggle"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-tinta-700 hover:bg-papel-100 lg:hidden cursor-pointer"
            aria-label="Abrir menu"
          >
            <IconMenu className="h-6 w-6" />
          </label>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <NotificationBell listLink="/admin/notificacoes/historico" />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${theme.chipBg} ${theme.chipText} ${theme.chipRing}`}>
              {roleLabels[role] ?? role}
            </span>
            <span className="text-sm text-tinta-700 hidden sm:block">
              {nome}
            </span>
            <UserAvatar nome={nome} src={avatarUrl} size={32} className="ring-2 ring-accent-100" />
          </div>
        </header>

        <main className="w-full p-4 pb-24 lg:p-8 lg:pb-10 xl:px-10 2xl:px-14">
          {children}
        </main>
      </div>
    </div>
  )
}
