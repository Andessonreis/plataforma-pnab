import type { Category, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

export const categoriasRepository = {
  list(includeInactive: boolean): Promise<Category[]> {
    return prisma.category.findMany({
      where: includeInactive ? {} : { ativa: true },
      orderBy: { ordem: 'asc' },
    })
  },

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } })
  },

  findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { slug } })
  },

  findSlugsStartingWith(slug: string): Promise<{ slug: string }[]> {
    return prisma.category.findMany({
      where: { slug: { startsWith: slug } },
      select: { slug: true },
    })
  },

  findByNome(nome: string, exceptId?: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: exceptId ? { nome, id: { not: exceptId } } : { nome },
    })
  },

  findLast(): Promise<Category | null> {
    return prisma.category.findFirst({ orderBy: { ordem: 'desc' } })
  },

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data })
  },

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data })
  },

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } })
  },

  reorder(items: { id: string; ordem: number }[]): Promise<unknown> {
    return prisma.$transaction(
      items.map((item) =>
        prisma.category.update({ where: { id: item.id }, data: { ordem: item.ordem } }),
      ),
    )
  },
}
