import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const exportInscricoesRepository = {
  findParaExport(editalId?: string, statuses?: InscricaoStatus[]) {
    return prisma.inscricao.findMany({
      where: {
        ...(editalId ? { editalId } : {}),
        ...(statuses && statuses.length ? { status: { in: statuses } } : {}),
      },
      include: {
        edital: { select: { titulo: true } },
        proponente: { select: { nome: true, cpfCnpj: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },
}
