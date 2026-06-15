import type { Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const usuariosRepository = {
  findByCpfCnpjOrEmail(cpfCnpj: string, email: string) {
    return prisma.user.findFirst({
      where: { OR: [{ cpfCnpj }, { email }] },
    })
  },

  findByEmailOrCpfCnpjActive(args: { email?: string; cpfCnpj?: string }) {
    return prisma.user.findFirst({
      where: {
        ativo: true,
        OR: [
          ...(args.cpfCnpj ? [{ cpfCnpj: args.cpfCnpj }] : []),
          ...(args.email ? [{ email: args.email }] : []),
        ],
      },
    })
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data })
  },

  findResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    })
  },

  async createResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    })
    return prisma.passwordResetToken.create({
      data: { userId, token: tokenHash, expiresAt },
    })
  },

  consumeResetTokenAndUpdatePassword(args: { tokenId: string; userId: string; passwordHash: string }) {
    return prisma.$transaction([
      prisma.user.update({ where: { id: args.userId }, data: { password: args.passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: args.tokenId }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.updateMany({
        where: { userId: args.userId, id: { not: args.tokenId }, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ])
  },
}
