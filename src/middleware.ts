import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

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


  return NextResponse.next()
})

export const config = {
  // Não aplicar middleware a assets estáticos e internals do Next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
