import type { Edital, EditalStatus, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const editaisRepository = {
  findById(id: string): Promise<Edital | null> {
    return prisma.edital.findUnique({ where: { id } })
  },

  findBySlug(slug: string): Promise<Edital | null> {
    return prisma.edital.findUnique({ where: { slug } })
  },

  async list(args: { page: number; pageSize: number; status?: string }): Promise<{ items: Edital[]; total: number }> {
    const where: Prisma.EditalWhereInput = args.status
      ? { status: args.status as EditalStatus }
      : {}

    const [items, total] = await Promise.all([
      prisma.edital.findMany({
        where,
        skip: (args.page - 1) * args.pageSize,
        take: args.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.edital.count({ where }),
    ])

    return { items, total }
  },

  create(data: Prisma.EditalCreateInput): Promise<Edital> {
    return prisma.edital.create({ data })
  },

  update(id: string, data: Prisma.EditalUpdateInput): Promise<Edital> {
    return prisma.edital.update({ where: { id }, data })
  },

  delete(id: string): Promise<Edital> {
    return prisma.edital.delete({ where: { id } })
  },
}
