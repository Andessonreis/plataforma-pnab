import { prisma } from '@server/lib/db'

export const avaliadoresRepository = {
  listAvaliadores() {
    return prisma.user.findMany({
      where: { role: 'AVALIADOR', ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    })
  },

  findEditalStatusDaInscricao(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, edital: { select: { status: true } } },
    })
  },
}
