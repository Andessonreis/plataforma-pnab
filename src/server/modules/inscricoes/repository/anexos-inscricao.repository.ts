import { prisma } from '@server/lib/db'

export const anexosInscricaoRepository = {
  findInscricaoParaAnexo(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, proponenteId: true, status: true },
    })
  },

  createAnexo(data: { inscricaoId: string; tipo: string; titulo: string; url: string }) {
    return prisma.anexoInscricao.create({
      data,
      select: {
        id: true,
        tipo: true,
        titulo: true,
        url: true,
        valido: true,
        observacao: true,
        createdAt: true,
      },
    })
  },

  findAnexoComInscricao(anexoId: string) {
    return prisma.anexoInscricao.findUnique({
      where: { id: anexoId },
      select: {
        id: true,
        url: true,
        inscricaoId: true,
        inscricao: { select: { proponenteId: true, status: true } },
      },
    })
  },

  findAnexoUrl(anexoId: string) {
    return prisma.anexoInscricao.findUnique({
      where: { id: anexoId },
      select: { id: true, url: true, inscricaoId: true },
    })
  },

  deleteAnexo(anexoId: string) {
    return prisma.anexoInscricao.delete({ where: { id: anexoId }, select: { id: true } })
  },
}
