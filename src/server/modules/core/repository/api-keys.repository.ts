import type { ApiKey, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const apiKeysRepository = {
  create(data: Prisma.ApiKeyUncheckedCreateInput): Promise<ApiKey> {
    return prisma.apiKey.create({ data })
  },

  findById(id: string): Promise<ApiKey | null> {
    return prisma.apiKey.findUnique({ where: { id } })
  },

  revoke(id: string, revokedAt: Date): Promise<ApiKey> {
    return prisma.apiKey.update({ where: { id }, data: { revokedAt } })
  },

  listByUser(userId: string) {
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
  },
}
