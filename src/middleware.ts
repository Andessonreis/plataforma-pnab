import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

const ROLES_ADMIN: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role as UserRole | undefined

  // ── Área do Proponente ───────────────────────────────────────────────────────
  if (pathname.startsWith('/proponente')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (role !== 'PROPONENTE') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // ── Área do Avaliador ──────────────────────────────────────────────────────
  if (pathname.startsWith('/avaliador')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (role !== 'AVALIADOR') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // ── Área Admin / Backoffice ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!role || !ROLES_ADMIN.includes(role)) {
      // Avaliador tentando acessar /admin → redireciona para /avaliador
      if (role === 'AVALIADOR') {
        return NextResponse.redirect(new URL('/avaliador', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Não aplicar middleware a assets estáticos e internals do Next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
