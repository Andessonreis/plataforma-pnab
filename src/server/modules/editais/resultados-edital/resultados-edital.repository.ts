import { prisma } from '@server/lib/db'

export const resultadosEditalRepository = {
  findEditalForListagem(editalId: string) {
    return prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, status: true },
    })
  },

  findEditalForPublicacao(editalId: string) {
    return prisma.edital.findUnique({
      where: { id: editalId },
      select: {
        id: true,
        titulo: true,
        slug: true,
        status: true,
        vagasContemplados: true,
        vagasSuplentes: true,
        notaMinima: true,
      },
    })
  },

  findEditalForRelatorio(editalId: string) {
    return prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true, slug: true, status: true, valorTotal: true },
    })
  },

  findEditalForLista(editalId: string) {
    return prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, ano: true, slug: true },
    })
  },

  listInscricoesParaResultados(editalId: string) {
    return prisma.inscricao.findMany({
      where: { editalId },
      include: {
        proponente: { select: { nome: true, cpfCnpj: true } },
        avaliacoes: {
          where: { finalizada: true },
          select: { notaTotal: true, avaliadorId: true },
        },
      },
      orderBy: [
        { posicao: { sort: 'asc', nulls: 'last' } },
        { notaFinal: { sort: 'desc', nulls: 'last' } },
      ],
    })
  },

  listInscricoesPorStatus(editalId: string, status: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA') {
    return prisma.inscricao.findMany({
      where: { editalId, status },
      orderBy: [{ notaFinal: 'desc' }, { numero: 'asc' }],
      include: { proponente: { select: { nome: true, cpfCnpj: true } } },
    })
  },

  listInscricoesPorFiltro(editalId: string, statusFilter: string[], orderByNota: boolean) {
    return prisma.inscricao.findMany({
      where: { editalId, status: { in: statusFilter as never } },
      orderBy: orderByNota
        ? [{ notaFinal: 'desc' as const }, { numero: 'asc' as const }]
        : [{ numero: 'asc' as const }],
      include: { proponente: { select: { nome: true, cpfCnpj: true } } },
    })
  },

  listInscricoesParaEmail(inscricaoIds: string[]) {
    return prisma.inscricao.findMany({
      where: { id: { in: inscricaoIds } },
      include: { proponente: { select: { email: true, nome: true } } },
    })
  },

  updateEditalStatus(editalId: string, status: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL') {
    return prisma.edital.update({ where: { id: editalId }, data: { status } })
  },
}
