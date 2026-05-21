import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole } from '@prisma/client'
import { ACCESS_TOKEN_COOKIE } from '@server/lib/auth/cookies'
import { verifyAccessToken } from '@server/lib/auth/jwt'
import { corsHeaders, handlePreflight } from '@/lib/api/cors'

const ROLES_ADMIN: UserRole[] = ['ADMIN', 'ATENDIMENTO', 'HABILITADOR']

function handleV1Cors(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/v1/')) return null

  if (req.method === 'OPTIONS') {
    return handlePreflight(req)
  }

  const response = NextResponse.next()
  const headers = corsHeaders(req)
  for (const [key, value] of Object.entries(headers)) {
    if (value) response.headers.set(key, value)
  }
  return response
}

async function readRole(req: NextRequest): Promise<UserRole | null> {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) return null
  const claims = await verifyAccessToken(token)
  return (claims?.role ?? null) as UserRole | null
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── CORS para /api/v1/* ──────────────────────────────────────────────────
  const corsResponse = handleV1Cors(req)
  if (corsResponse) return corsResponse

  const isProponente = pathname.startsWith('/proponente')
  const isAvaliador = pathname.startsWith('/avaliador')
  const isAdmin = pathname.startsWith('/admin')

  if (!isProponente && !isAvaliador && !isAdmin) {
    return NextResponse.next()
  }

  const role = await readRole(req)
  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isProponente && role !== 'PROPONENTE') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isAvaliador && role !== 'AVALIADOR') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isAdmin && !ROLES_ADMIN.includes(role)) {
    if (role === 'AVALIADOR') {
      return NextResponse.redirect(new URL('/avaliador', req.url))
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
