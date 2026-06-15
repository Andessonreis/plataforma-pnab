import { prisma } from '@server/lib/db'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import {
  AvaliacaoFinalizadaError,
  AvaliacaoNaoEncontradaError,
  AvaliadoresInvalidosError,
  StatusInscricaoInvalidoError,
} from '../errors/avaliadores.errors'

export const avaliadoresRepository = {
  listAvaliadores() {
    return prisma.user.findMany({
      where: { role: 'AVALIADOR', ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    })
  },

  findEditalStatusDaInscricao(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, edital: { select: { status: true } } },
    })
  },

  atribuirAvaliadores(inscricaoId: string, avaliadorIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const inscricao = await tx.inscricao.findUnique({
        where: { id: inscricaoId },
        select: { id: true, status: true, numero: true },
      })
      if (!inscricao) throw new InscricaoNaoEncontradaError()
      if (inscricao.status !== 'HABILITADA' && inscricao.status !== 'EM_AVALIACAO') {
        throw new StatusInscricaoInvalidoError()
      }

      const avaliadores = await tx.user.findMany({
        where: { id: { in: avaliadorIds }, role: 'AVALIADOR', ativo: true },
        select: { id: true },
      })
      if (avaliadores.length !== avaliadorIds.length) throw new AvaliadoresInvalidosError()

      const existing = await tx.avaliacao.findMany({
        where: { inscricaoId, avaliadorId: { in: avaliadorIds } },
        select: { avaliadorId: true },
      })
      const existingIds = new Set(existing.map((e) => e.avaliadorId))
      const newIds = avaliadorIds.filter((id) => !existingIds.has(id))

      if (newIds.length === 0) return { created: 0, newIds: [] as string[], numero: inscricao.numero }

      await tx.avaliacao.createMany({
        data: newIds.map((avaliadorId) => ({
          inscricaoId,
          avaliadorId,
          notas: [],
          notaTotal: null,
          finalizada: false,
        })),
      })

      if (inscricao.status === 'HABILITADA') {
        await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'EM_AVALIACAO' } })
      }

      return { created: newIds.length, newIds, numero: inscricao.numero }
    })
  },

  removerAvaliador(inscricaoId: string, avaliadorId: string) {
    return prisma.$transaction(async (tx) => {
      const inscricao = await tx.inscricao.findUnique({
        where: { id: inscricaoId },
        select: { id: true, status: true },
      })
      if (!inscricao) throw new InscricaoNaoEncontradaError()

      const avaliacao = await tx.avaliacao.findUnique({
        where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
        select: { id: true, finalizada: true },
      })
      if (!avaliacao) throw new AvaliacaoNaoEncontradaError()
      if (avaliacao.finalizada) throw new AvaliacaoFinalizadaError()

      await tx.avaliacao.delete({ where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } } })

      const remaining = await tx.avaliacao.count({ where: { inscricaoId } })
      if (remaining === 0 && inscricao.status === 'EM_AVALIACAO') {
        await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'HABILITADA' } })
      }
    })
  },
}
