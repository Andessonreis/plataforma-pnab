import { createHmac } from 'crypto'
import type { UserRole } from '@prisma/client'
import { prisma } from '@server/lib/db'
import { auth } from '@server/lib/auth'

export interface ApiCaller {
  type: 'session' | 'apikey'
  userId: string
  role: UserRole
  apiKeyId?: string
}

/**
 * Resolve o autor da requisição aceitando API key (Bearer pnab_…) ou a sessão
 * (JWT pnab.access). Mantém a autenticação dual das rotas v1 do catálogo.
 */
export async function resolveApiCaller(headers: Headers): Promise<ApiCaller | null> {
  const authHeader = headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.slice(7)
    if (rawKey.startsWith('pnab_')) {
      return resolveApiKey(rawKey)
    }
  }

  const session = await auth()
  if (session?.user?.id) {
    return { type: 'session', userId: session.user.id, role: session.user.role }
  }

  return null
}

export function callerHasRole(caller: ApiCaller | null, ...roles: UserRole[]): caller is ApiCaller {
  if (!caller) return false
  return roles.includes(caller.role)
}

export function callerIsAuthenticated(caller: ApiCaller | null): caller is ApiCaller {
  return caller !== null
}

export function ipFromHeaders(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    undefined
  )
}

export function hmacKey(rawKey: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return createHmac('sha256', secret).update(rawKey).digest('hex')
}

async function resolveApiKey(rawKey: string): Promise<ApiCaller | null> {
  const keyHash = hmacKey(rawKey)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, role: true, ativo: true } } },
  })

  if (!apiKey) return null
  if (apiKey.revokedAt) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
  if (!apiKey.user.ativo) return null

  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return { type: 'apikey', userId: apiKey.user.id, role: apiKey.user.role, apiKeyId: apiKey.id }
}
