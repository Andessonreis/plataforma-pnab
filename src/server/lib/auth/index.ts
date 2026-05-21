import { cookies } from 'next/headers'
import type { UserRole } from '@prisma/client'
import { verifyAccessToken } from './jwt'
import { ACCESS_TOKEN_COOKIE } from './cookies'

/**
 * Shim compatível com a API antiga do NextAuth — outros arquivos do projeto
 * importam `auth()` daqui esperando o formato `{ user: { id, email, name, role } }`.
 * Por baixo, lê o JWT custom (cookie pnab.access).
 */

export type Session = {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
  }
} | null

export async function auth(): Promise<Session> {
  const store = await cookies()
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) return null
  const claims = await verifyAccessToken(token)
  if (!claims) return null
  return {
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.nome,
      role: claims.role as UserRole,
    },
  }
}
