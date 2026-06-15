import { Prisma } from '@prisma/client'
import { prisma } from '@server/lib/db'

const avaliacaoSelect = {
  id: true,
  notas: true,
  parecer: true,
  notaTotal: true,
  finalizada: true,
  updatedAt: true,
} satisfies Prisma.AvaliacaoSelect

const avaliacaoSalvaSelect = {
  id: true,
  notaTotal: true,
  finalizada: true,
  updatedAt: true,
} satisfies Prisma.AvaliacaoSelect

export type AvaliacaoRow = Prisma.AvaliacaoGetPayload<{ select: typeof avaliacaoSelect }>
export type AvaliacaoSalvaRow = Prisma.AvaliacaoGetPayload<{ select: typeof avaliacaoSalvaSelect }>

export type DadosUpsertAvaliacao = {
  notas: Prisma.InputJsonValue
  parecer: string | null
  notaTotal: number
  finalizada: boolean
}

export const avaliacaoRepository = {
  findInscricaoComAvaliacao(inscricaoId: string, avaliadorId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: {
        id: true,
        status: true,
        avaliacoes: { where: { avaliadorId }, select: avaliacaoSelect },
      },
    })
  },

  findInscricaoParaSalvar(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, numero: true, status: true, edital: { select: { status: true } } },
    })
  },

  findAvaliacao(inscricaoId: string, avaliadorId: string) {
    return prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      select: { id: true, finalizada: true },
    })
  },

  upsertAvaliacao(
    inscricaoId: string,
    avaliadorId: string,
    data: DadosUpsertAvaliacao,
  ): Promise<AvaliacaoSalvaRow> {
    return prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      update: data,
      create: { inscricaoId, avaliadorId, ...data },
      select: avaliacaoSalvaSelect,
    })
  },
}
