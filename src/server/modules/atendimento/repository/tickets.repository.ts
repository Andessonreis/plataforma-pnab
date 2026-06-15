import type { Atendimento, AtendimentoStatus, Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

const autorSelect = { autor: { select: { nome: true, email: true } } }

export const ticketsRepository = {
  create(data: Prisma.AtendimentoUncheckedCreateInput): Promise<Atendimento> {
    return prisma.atendimento.create({ data })
  },

  list(page: number, pageSize: number, status?: string) {
    const where = status ? { status: status as AtendimentoStatus } : {}
    return Promise.all([
      prisma.atendimento.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: autorSelect,
      }),
      prisma.atendimento.count({ where }),
    ])
  },

  findByIdWithAutor(id: string) {
    return prisma.atendimento.findUnique({
      where: { id },
      include: autorSelect,
    })
  },

  findById(id: string): Promise<Atendimento | null> {
    return prisma.atendimento.findUnique({ where: { id } })
  },

  update(id: string, data: Prisma.AtendimentoUpdateInput): Promise<Atendimento> {
    return prisma.atendimento.update({ where: { id }, data })
  },
}
