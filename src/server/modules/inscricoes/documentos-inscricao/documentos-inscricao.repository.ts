import { prisma } from '@server/lib/db'

export const documentosInscricaoRepository = {
  findParaComprovante(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: {
        numero: true,
        status: true,
        categoria: true,
        submittedAt: true,
        createdAt: true,
        campos: true,
        proponente: { select: { id: true, nome: true, cpfCnpj: true, email: true, tipoProponente: true } },
        edital: { select: { titulo: true, ano: true } },
      },
    })
  },

  findParaProjeto(inscricaoId: string) {
    return prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: {
        numero: true,
        status: true,
        categoria: true,
        submittedAt: true,
        createdAt: true,
        campos: true,
        proponente: { select: { id: true, nome: true, cpfCnpj: true, email: true, tipoProponente: true } },
        edital: { select: { titulo: true, ano: true, camposFormulario: true } },
        anexos: { select: { titulo: true, tipo: true, valido: true } },
      },
    })
  },
}
