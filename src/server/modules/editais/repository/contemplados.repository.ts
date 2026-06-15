import type { Prisma, ProjetoApoiado } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const contempladosRepository = {
  findEditalById(editalId: string) {
    return prisma.edital.findUnique({ where: { id: editalId }, select: { id: true } })
  },

  upsertProjetoApoiado(
    inscricaoId: string,
    valorAprovado: number,
  ): Prisma.PrismaPromise<ProjetoApoiado> {
    return prisma.projetoApoiado.upsert({
      where: { inscricaoId },
      update: { valorAprovado },
      create: {
        inscricaoId,
        valorAprovado,
        statusExecucao: 'EM_EXECUCAO',
        publicado: false,
      },
    })
  },

  transaction(updates: Prisma.PrismaPromise<ProjetoApoiado>[]) {
    return prisma.$transaction(updates)
  },
}
