import type { Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

const profileSelect = {
  id: true,
  nome: true,
  email: true,
  cpfCnpj: true,
  role: true,
  tipoProponente: true,
  telefone: true,
  cep: true,
  logradouro: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  uf: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const meRepository = {
  findProfile(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: profileSelect })
  },

  findPassword(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
  },

  update(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id: userId }, data })
  },
}
