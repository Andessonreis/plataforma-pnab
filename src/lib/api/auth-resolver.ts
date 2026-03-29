import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { UserRole } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiCaller {
  type: 'session' | 'apikey'
  userId: string
  role: UserRole
  apiKeyId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve autenticação: Bearer API key OU session NextAuth
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveAuth(req: NextRequest): Promise<ApiCaller | null> {
  // 1. Tentar Bearer token (API key)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.slice(7)
    if (rawKey.startsWith('pnab_')) {
      return resolveApiKey(rawKey)
    }
  }

  // 2. Fallback para session NextAuth (cookie)
  const session = await auth()
  if (session?.user?.id) {
    return {
      type: 'session',
      userId: session.user.id,
      role: session.user.role as UserRole,
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve API key por hash SHA-256
// ─────────────────────────────────────────────────────────────────────────────

async function resolveApiKey(rawKey: string): Promise<ApiCaller | null> {
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, role: true, ativo: true } } },
  })

  if (!apiKey) return null
  if (apiKey.revokedAt) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
  if (!apiKey.user.ativo) return null

  // Atualiza lastUsedAt de forma assíncrona (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return {
    type: 'apikey',
    userId: apiKey.user.id,
    role: apiKey.user.role,
    apiKeyId: apiKey.id,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de autorização
// ─────────────────────────────────────────────────────────────────────────────

export function requireRole(caller: ApiCaller | null, ...roles: UserRole[]): caller is ApiCaller {
  if (!caller) return false
  return roles.includes(caller.role)
}

export function requireAnyAuth(caller: ApiCaller | null): caller is ApiCaller {
  return caller !== null
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrai IP do request
// ─────────────────────────────────────────────────────────────────────────────

export function getIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
}
