import { prisma } from '@server/lib/db'

type UpsertProjetoApoiadoInput = {
  inscricaoId: string
  valorAprovado: number
  statusExecucao: string
  contrapartida: string | null
}

export const contempladosRepository = {
  findEditalById(editalId: string) {
    return prisma.edital.findUnique({ where: { id: editalId }, select: { id: true, titulo: true } })
  },

  findInscricaoByNumero(numero: string, editalId: string) {
    return prisma.inscricao.findFirst({
      where: { numero, editalId },
      select: { id: true },
    })
  },

  upsertProjetoApoiado(data: UpsertProjetoApoiadoInput) {
    return prisma.projetoApoiado.upsert({
      where: { inscricaoId: data.inscricaoId },
      create: {
        inscricaoId: data.inscricaoId,
        valorAprovado: data.valorAprovado,
        statusExecucao: data.statusExecucao,
        contrapartida: data.contrapartida,
        publicado: true,
      },
      update: {
        valorAprovado: data.valorAprovado,
        statusExecucao: data.statusExecucao,
        contrapartida: data.contrapartida,
        publicado: true,
      },
    })
  },
}
