import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@prisma/client'
import { corsHeaders, handlePreflight } from '@/lib/api/cors'

const ROLES_ADMIN: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR']

function handleV1Cors(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/v1/')) return null

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return handlePreflight(req)
  }

  // Para requests normais, adiciona headers CORS na response
  const response = NextResponse.next()
  const headers = corsHeaders(req)
  for (const [key, value] of Object.entries(headers)) {
    if (value) response.headers.set(key, value)
  }
  return response
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role as UserRole | undefined

  // ── CORS para /api/v1/* ──────────────────────────────────────────────────────
  const corsResponse = handleV1Cors(req)
  if (corsResponse) return corsResponse

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
  // Inclui /api/v1/* no matcher para CORS, além das páginas protegidas
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
