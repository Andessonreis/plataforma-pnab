import { prisma } from '@server/lib/db'

export const newsletterRepository = {
  findByEmail(email: string) {
    return prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true, ativo: true },
    })
  },

  reactivate(email: string, nome: string) {
    return prisma.newsletterSubscriber.update({
      where: { email },
      data: { ativo: true, nome },
    })
  },

  create(nome: string, email: string) {
    return prisma.newsletterSubscriber.create({
      data: { nome, email },
    })
  },
}
