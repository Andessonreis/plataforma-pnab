import type { UserRole } from '@prisma/client'
import { readAccessToken } from './cookies'
import { verifyAccessToken, type AccessTokenClaims } from './jwt'

export type CurrentUser = {
  id: string
  email: string
  nome: string
  role: UserRole
}

function fromClaims(claims: AccessTokenClaims): CurrentUser {
  return {
    id: claims.sub,
    email: claims.email,
    nome: claims.nome,
    role: claims.role,
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await readAccessToken()
  if (!token) return null
  const claims = await verifyAccessToken(token)
  if (!claims) return null
  return fromClaims(claims)
}

export async function getCurrentUserFromHeaders(headers: Headers): Promise<CurrentUser | null> {
  const cookie = headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)pnab\.access=([^;]+)/)
  if (!match) return null
  const token = decodeURIComponent(match[1])
  const claims = await verifyAccessToken(token)
  if (!claims) return null
  return fromClaims(claims)
}
