import { Suspense } from 'react'
import { Anton, Questrial } from 'next/font/google'
import type { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { Header, Footer, CookieBanner } from '@/components/layout'
import { ActiveBanners } from '@/components/layout'

// Tipografia SECULT 2025. A principal da identidade é a Sunbeam Stamp, uma
// condensada pesada de caixa alta, comercial; Anton é a substituta gratuita de
// mesma classe. Questrial é a auxiliar e vem da própria especificação.
//
// Não há manuscrita na identidade: a secundária é a Ananias, uma geométrica
// desenhada à mão em caixa alta. Enquanto não houver licença, a secundária
// também sai em Anton, com corpo e espaçamento próprios.
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' })
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
    <div className={`${display.variable} ${questrial.variable} flex min-h-screen flex-col`}>
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
