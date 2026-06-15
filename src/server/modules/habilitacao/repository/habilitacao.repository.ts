import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const habilitacaoRepository = {
  findParaHabilitacao(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: {
        id: true,
        numero: true,
        status: true,
        proponente: { select: { email: true, nome: true } },
        edital: { select: { titulo: true, status: true } },
      },
    })
  },

  aplicar(inscricaoId: string, status: InscricaoStatus, motivoInabilitacao: string | null) {
    return prisma.inscricao.update({
      where: { id: inscricaoId },
      data: { status, motivoInabilitacao },
      select: { id: true },
    })
  },
}
