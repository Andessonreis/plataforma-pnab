import type { ArquivoEdital, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const arquivosEditalRepository = {
  listByEdital(editalId: string): Promise<ArquivoEdital[]> {
    return prisma.arquivoEdital.findMany({
      where: { editalId },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: string): Promise<ArquivoEdital | null> {
    return prisma.arquivoEdital.findUnique({ where: { id } })
  },

  create(data: Prisma.ArquivoEditalCreateInput): Promise<ArquivoEdital> {
    return prisma.arquivoEdital.create({ data })
  },

  delete(id: string): Promise<ArquivoEdital> {
    return prisma.arquivoEdital.delete({ where: { id } })
  },
}
