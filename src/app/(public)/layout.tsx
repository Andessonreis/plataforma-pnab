import { Suspense } from 'react'
import type { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { Header, Footer, CookieBanner } from '@client/components/layout'
import { ActiveBanners } from '@client/components/layout'

const ROLES_ADMIN: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR']

function userAreaHrefFromRole(role: UserRole | undefined): string {
  if (!role) return '/login'
  if (role === 'PROPONENTE') return '/proponente'
  if (role === 'AVALIADOR') return '/avaliador'
  if (ROLES_ADMIN.includes(role)) return '/admin'
  return '/login'
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const userAreaHref = userAreaHrefFromRole(session?.user?.role)

  return (
    <div className="flex min-h-screen flex-col">
      <Header userAreaHref={userAreaHref} />
      <Suspense fallback={null}>
        <ActiveBanners />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
