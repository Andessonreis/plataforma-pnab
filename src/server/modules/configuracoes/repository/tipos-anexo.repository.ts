import type { AttachmentType, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const tiposAnexoRepository = {
  list(tag?: string): Promise<AttachmentType[]> {
    return prisma.attachmentType.findMany({
      where: tag ? { tag } : {},
      orderBy: [{ tag: 'asc' }, { isSystem: 'desc' }, { label: 'asc' }],
    })
  },

  distinctTags(): Promise<{ tag: string }[]> {
    return prisma.attachmentType.findMany({
      select: { tag: true },
      distinct: ['tag'],
      orderBy: { tag: 'asc' },
    })
  },

  findById(id: string): Promise<AttachmentType | null> {
    return prisma.attachmentType.findUnique({ where: { id } })
  },

  findByTipo(tipo: string): Promise<AttachmentType | null> {
    return prisma.attachmentType.findFirst({ where: { tipo } })
  },

  findTiposStartingWith(tipo: string): Promise<{ tipo: string }[]> {
    return prisma.attachmentType.findMany({
      where: { tipo: { startsWith: tipo } },
      select: { tipo: true },
    })
  },

  create(data: Prisma.AttachmentTypeCreateInput): Promise<AttachmentType> {
    return prisma.attachmentType.create({ data })
  },

  update(id: string, data: Prisma.AttachmentTypeUpdateInput): Promise<AttachmentType> {
    return prisma.attachmentType.update({ where: { id }, data })
  },

  delete(id: string): Promise<AttachmentType> {
    return prisma.attachmentType.delete({ where: { id } })
  },
}
