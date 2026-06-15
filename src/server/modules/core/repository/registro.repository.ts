import type { Prisma, User } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const registroRepository = {
  findByCpfOrEmail(cpfCnpj: string, email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { OR: [{ cpfCnpj }, { email }] } })
  },

  create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return prisma.user.create({ data })
  },
}
