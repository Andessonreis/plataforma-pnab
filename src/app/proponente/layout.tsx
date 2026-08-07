import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProponenteSidebar } from './sidebar'
import { MobileMenuButton } from './mobile-menu-button'
import { ProponenteFooter } from './proponente-footer'
import { prisma } from '@/lib/db'

export default async function ProponenteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  // Carrega avatarUrl pra mostrar no header e na sidebar.
  // Não está na session (NextAuth) — buscar é leve e dispensa migração de schema da session.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })
  const nome = session.user.name ?? 'Proponente'
  const avatarUrl = user?.avatarUrl ?? null

  return (
    // .tema-secult resolve as CSS vars --brand-*/--accent-* pra cor real da
    // identidade SECULT (terracota/dourado). papel-textura é a mesma trama
    // diagonal sutil da home, no lugar do cinza chapado genérico de SaaS.
    <div className="tema-secult papel-textura font-questrial flex min-h-screen bg-papel-50">
      <ProponenteSidebar userName={nome} userAvatarUrl={avatarUrl} />

      {/* flex-col + min-h-screen aqui (não só no wrapper externo): com pouco
          conteúdo (ex.: filtro sem resultado) essa coluna ficava mais curta
          que a viewport, e o rodapé subia deixando vazio embaixo enquanto a
          sidebar fixa continuava até o fim da tela. main cresce (flex-1) e
          empurra o rodapé pro fim de verdade. */}
      <div className="relative flex min-h-screen flex-1 min-w-0 flex-col lg:ml-64">
        <MobileMenuButton />

        {/* pt-20 no mobile: abre espaço pro botão hamburguer flutuante
            (fixed left-3 top-3, ~56px de altura) não cobrir o título da
            página em telas sem hero próprio (dashboard tem espaço embutido). */}
        <main className="flex-1 p-4 pt-20 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>

        <ProponenteFooter />
      </div>
    </div>
  )
}
