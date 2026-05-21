import { createHash, randomUUID } from 'crypto'
import { prisma } from '@server/lib/db'
import {
  REFRESH_TOKEN_TTL_SECONDS,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type IssueContext = {
  userAgent?: string | null
  ip?: string | null
  deviceLabel?: string | null
}

export async function issueRefreshToken(userId: string, ctx: IssueContext = {}): Promise<string> {
  const jti = randomUUID()
  const token = await signRefreshToken({ sub: userId, jti })

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId,
      tokenHash: hashToken(token),
      deviceLabel: ctx.deviceLabel ?? null,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  })

  return token
}

export type ValidatedRefresh = {
  userId: string
  jti: string
}

export async function validateRefreshToken(token: string): Promise<ValidatedRefresh | null> {
  const claims = await verifyRefreshToken(token)
  if (!claims) return null

  const record = await prisma.refreshToken.findUnique({
    where: { id: claims.jti },
  })

  if (!record) return null
  if (record.revokedAt) return null
  if (record.expiresAt < new Date()) return null
  if (record.tokenHash !== hashToken(token)) return null
  if (record.userId !== claims.sub) return null

  await prisma.refreshToken.update({
    where: { id: claims.jti },
    data: { lastUsedAt: new Date() },
  })

  return { userId: claims.sub, jti: claims.jti }
}

export async function revokeRefreshTokenByJti(jti: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { id: jti, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
