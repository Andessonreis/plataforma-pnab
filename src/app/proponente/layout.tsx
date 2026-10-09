import type { Viewport } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { variaveisDeFonte } from '../fontes'
import { MobileTopBar } from './mobile-top-bar'
import { ProponenteFooter } from './proponente-footer'
import { ProponenteSidebar } from './sidebar'

// `cover` deixa a barra de abas do rodapé respeitar a área segura do iPhone (env(safe-area-inset-bottom)).
export const viewport: Viewport = { viewportFit: 'cover' }

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  // Avatar e contagem de avisos não estão na session (NextAuth): buscar é leve
  // e dispensa migração de schema da session.
  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { avatarUrl: true } }),
    prisma.notification.count({ where: { userId: session.user.id, lidaEm: null } }),
  ])
  const nome = session.user.name ?? 'Proponente'
  const avatarUrl = user?.avatarUrl ?? null

  return (
    // `variaveisDeFonte` carrega Anton (.titulo/.rotulo) e Questrial; sem ele a
    // área cai em Inter e o título perde a identidade. `.tema-secult` resolve
    // --brand-*/--accent-* pra terracota/dourado reais, e `papel-textura` é a
    // trama sutil de papel da home. O menu e o rodapé são escuros e o miolo é
    // papel: o contraste de superfícies é o que dá profundidade à área.
    <div className={`${variaveisDeFonte} tema-secult papel-textura font-questrial min-h-[100dvh] bg-papel-50 text-tinta-900`}>
      <div className="lg:flex">
        <ProponenteSidebar userName={nome} userAvatarUrl={avatarUrl} unreadCount={unreadCount} />

        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <MobileTopBar nome={nome} avatarUrl={avatarUrl} />
          <main className="flex-1 overflow-x-clip px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
          <ProponenteFooter />
        </div>
      </div>
    </div>
  )
}
