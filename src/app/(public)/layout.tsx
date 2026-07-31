import { Suspense } from 'react'
import { Rye, Caveat, Questrial } from 'next/font/google'
import type { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { Header, Footer, CookieBanner } from '@/components/layout'
import { ActiveBanners } from '@/components/layout'

// Tipografia SECULT 2025 — substitutas gratuitas de Sunbeam Stamp e Ananias,
// que são comerciais. Declaradas aqui, e não numa página, porque cabeçalho e
// rodapé também são da identidade e vivem fora de qualquer page.
const rye = Rye({ subsets: ['latin'], weight: '400', variable: '--font-rye' })
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-caveat' })
const questrial = Questrial({ subsets: ['latin'], weight: '400', variable: '--font-questrial' })

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
    <div className={`${rye.variable} ${caveat.variable} ${questrial.variable} flex min-h-screen flex-col`}>
      <Header userAreaHref={userAreaHref} />
      <Suspense fallback={null}>
        <div className="tema-secult font-questrial">
          <ActiveBanners />
        </div>
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
