import { prisma } from '@server/lib/db'

export const habilitadoresRepository = {
  listHabilitadores() {
    return prisma.user.findMany({
      where: { role: 'HABILITADOR', ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    })
  },
}
