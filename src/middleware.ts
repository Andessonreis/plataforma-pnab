import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

const ROLES_ADMIN: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Área do Proponente ───────────────────────────────────────────────────────
  if (pathname.startsWith('/proponente')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // ── Área Admin / Backoffice ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const role = session.user?.role as UserRole | undefined
    if (!role || !ROLES_ADMIN.includes(role)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Não aplicar middleware a assets estáticos e internals do Next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
