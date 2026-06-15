import { prisma } from '@server/lib/db'

export const autenticacaoRepository = {
  findUserByCpfCnpj(cpfCnpj: string) {
    return prisma.user.findUnique({ where: { cpfCnpj } })
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  updateUserPassword(id: string, password: string) {
    return prisma.user.update({ where: { id }, data: { password } })
  },
}
