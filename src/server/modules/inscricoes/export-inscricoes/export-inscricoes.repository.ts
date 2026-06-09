import { prisma } from '@server/lib/db'

export const exportInscricoesRepository = {
  findParaExport(editalId?: string) {
    return prisma.inscricao.findMany({
      where: editalId ? { editalId } : {},
      include: {
        edital: { select: { titulo: true } },
        proponente: { select: { nome: true, cpfCnpj: true, email: true } },
        _count: { select: { avaliacoes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },
}
