import { Prisma } from '@prisma/client'
import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@server/lib/db'

const recursoComInscricaoInclude = {
  inscricao: {
    include: {
      proponente: { select: { email: true, nome: true } },
      edital: { select: { titulo: true, slug: true } },
    },
  },
} satisfies Prisma.RecursoInclude

export type RecursoComInscricao = Prisma.RecursoGetPayload<{ include: typeof recursoComInscricaoInclude }>

export const recursosRepository = {
  findInscricaoParaRecurso(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { proponenteId: true, status: true, editalId: true },
    })
  },

  findProponente(inscricaoId: string) {
    return prisma.inscricao.findUnique({ where: { id: inscricaoId }, select: { proponenteId: true } })
  },

  findRecursoExistente(inscricaoId: string, fase: string) {
    return prisma.recurso.findFirst({ where: { inscricaoId, fase } })
  },

  createRecurso(data: { inscricaoId: string; fase: string; texto: string; urlAnexos: string[] }) {
    return prisma.recurso.create({ data })
  },

  setStatusInscricao(inscricaoId: string, status: InscricaoStatus) {
    return prisma.inscricao.update({ where: { id: inscricaoId }, data: { status }, select: { id: true } })
  },

  listByInscricao(inscricaoId: string) {
    return prisma.recurso.findMany({ where: { inscricaoId }, orderBy: { createdAt: 'desc' } })
  },

  findRecursoComInscricao(recursoId: string): Promise<RecursoComInscricao | null> {
    return prisma.recurso.findUnique({ where: { id: recursoId }, include: recursoComInscricaoInclude })
  },

  decidir(recursoId: string, data: { decisao: string; justificativa: string; decidedAt: Date }) {
    return prisma.recurso.update({ where: { id: recursoId }, data, select: { id: true } })
  },
}
