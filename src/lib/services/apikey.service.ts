import { randomBytes, createHmac } from 'crypto'
import { prisma } from '@server/lib/db'
import { ServiceError } from '@shared/service-error'

const KEY_PREFIX = 'pnab_'

function hmacKey(rawKey: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return createHmac('sha256', secret).update(rawKey).digest('hex')
}

export async function createApiKey(userId: string, label: string, scopes: string[] = [], expiresAt?: Date) {
  const rawKey = `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`
  const keyHash = hmacKey(rawKey)
  const prefix = rawKey.slice(0, 12)

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      label,
      keyHash,
      prefix,
      scopes,
      expiresAt: expiresAt ?? null,
    },
  })

  // rawKey é retornado apenas uma vez (como GitHub tokens)
  return {
    id: apiKey.id,
    key: rawKey,
    prefix: apiKey.prefix,
    label: apiKey.label,
    scopes: apiKey.scopes,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  }
}

export async function revokeApiKey(id: string, userId: string) {
  const apiKey = await prisma.apiKey.findUnique({ where: { id } })
  if (!apiKey) throw new ServiceError('NOT_FOUND', 'API key não encontrada.')
  if (apiKey.userId !== userId) throw new ServiceError('FORBIDDEN', 'Acesso negado.')
  if (apiKey.revokedAt) throw new ServiceError('CONFLICT', 'Esta API key já foi revogada.')

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  })
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      prefix: true,
      label: true,
      scopes: true,
      revokedAt: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
