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
      select: {
        proponenteId: true,
        status: true,
        editalId: true,
        edital: { select: { cronograma: true } },
      },
    })
  },

  findInscricaoParaList(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { proponenteId: true, edital: { select: { status: true } } },
    })
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

  decidir(
    recursoId: string,
    data: { decisao: string; justificativa: string; decididoPor: string; decidedAt: Date },
  ) {
    return prisma.recurso.update({ where: { id: recursoId }, data, select: { id: true } })
  },

  findRecursoBasico(recursoId: string) {
    return prisma.recurso.findUnique({
      where: { id: recursoId },
      select: { inscricaoId: true, fase: true, decisao: true },
    })
  },

  findAvaliacaoAtribuida(inscricaoId: string, avaliadorId: string) {
    return prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      select: { id: true },
    })
  },

  upsertResposta(recursoId: string, avaliadorId: string, decisao: string, justificativa: string) {
    return prisma.recursoResposta.upsert({
      where: { recursoId_avaliadorId: { recursoId, avaliadorId } },
      create: { recursoId, avaliadorId, decisao, justificativa },
      update: { decisao, justificativa },
    })
  },

  findRecursoParaConsolidacao(recursoId: string) {
    return prisma.recurso.findUnique({
      where: { id: recursoId },
      select: {
        inscricaoId: true,
        fase: true,
        decisao: true,
        respostas: { select: { decisao: true, justificativa: true } },
      },
    })
  },

  countAvaliacoes(inscricaoId: string) {
    return prisma.avaliacao.count({ where: { inscricaoId } })
  },

  findRecursoAnexos(recursoId: string) {
    return prisma.recurso.findUnique({
      where: { id: recursoId },
      select: { inscricaoId: true, urlAnexos: true, inscricao: { select: { proponenteId: true } } },
    })
  },

  listAggregated(where: Prisma.RecursoWhereInput, skip: number, take: number) {
    return prisma.recurso.findMany({
      where,
      include: {
        inscricao: {
          include: {
            proponente: { select: { nome: true, cpfCnpj: true } },
            edital: { select: { titulo: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  },

  countAggregated(where: Prisma.RecursoWhereInput): Promise<number> {
    return prisma.recurso.count({ where })
  },
}
