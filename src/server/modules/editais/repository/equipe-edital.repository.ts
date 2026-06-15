import type { FuncaoEdital } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const equipeEditalRepository = {
  listByEdital(editalId: string) {
    return prisma.editalMembro.findMany({
      where: { editalId },
      include: { user: { select: { id: true, nome: true, email: true } } },
    })
  },

  findEligibleUsers(userIds: string[], funcao: FuncaoEdital) {
    const expectedRole = funcao === 'AVALIADOR' ? 'AVALIADOR' : 'HABILITADOR'
    return prisma.user.findMany({
      where: { id: { in: userIds }, ativo: true, role: expectedRole },
      select: { id: true, nome: true },
    })
  },

  createMany(editalId: string, userIds: string[], funcao: FuncaoEdital) {
    return prisma.editalMembro.createMany({
      data: userIds.map((userId) => ({ editalId, userId, funcao })),
      skipDuplicates: true,
    })
  },

  delete(editalId: string, userId: string, funcao: FuncaoEdital) {
    return prisma.editalMembro.deleteMany({
      where: { editalId, userId, funcao },
    })
  },
}
