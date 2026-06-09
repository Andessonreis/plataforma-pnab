import { Prisma } from '@prisma/client'
import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@server/lib/db'

const detalheInclude = {
  edital: { select: { id: true, titulo: true, slug: true, categorias: true, camposFormulario: true, status: true } },
  anexos: { orderBy: { createdAt: 'asc' } },
  proponente: { select: { id: true, nome: true } },
} satisfies Prisma.InscricaoInclude

const submitInclude = {
  edital: {
    select: { id: true, titulo: true, status: true, categorias: true, camposFormulario: true, etapasCustomizadas: true },
  },
  anexos: true,
  proponente: { select: { email: true, nome: true, tipoProponente: true } },
} satisfies Prisma.InscricaoInclude

const adminListInclude = {
  edital: { select: { titulo: true } },
  proponente: { select: { nome: true, cpfCnpj: true } },
  _count: { select: { avaliacoes: true, recursos: true } },
} satisfies Prisma.InscricaoInclude

const proponenteListInclude = {
  edital: { select: { titulo: true, slug: true } },
  _count: { select: { anexos: true } },
} satisfies Prisma.InscricaoInclude

export type InscricaoDetalhe = Prisma.InscricaoGetPayload<{ include: typeof detalheInclude }>
export type InscricaoParaSubmit = Prisma.InscricaoGetPayload<{ include: typeof submitInclude }>
export type InscricaoAdminItem = Prisma.InscricaoGetPayload<{ include: typeof adminListInclude }>
export type InscricaoProponenteItem = Prisma.InscricaoGetPayload<{ include: typeof proponenteListInclude }>

export const inscricoesRepository = {
  findOwnership(id: string) {
    return prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, proponenteId: true, status: true, editalId: true },
    })
  },

  findParaRetract(id: string) {
    return prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, proponenteId: true, status: true, editalId: true, edital: { select: { status: true } } },
    })
  },

  findEditalParaInscricao(editalId: string) {
    return prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, status: true, ano: true, categorias: true },
    })
  },

  findEditalCategorias(editalId: string) {
    return prisma.edital.findUnique({ where: { id: editalId }, select: { categorias: true } })
  },

  findInscricaoExistente(editalId: string, proponenteId: string) {
    return prisma.inscricao.findFirst({ where: { editalId, proponenteId }, select: { id: true } })
  },

  countNoAno(ano: number) {
    return prisma.inscricao.count({ where: { numero: { startsWith: `PNAB-${ano}-` } } })
  },

  createRascunho(data: { numero: string; editalId: string; proponenteId: string; categoria: string | null }) {
    return prisma.inscricao.create({
      data: {
        numero: data.numero,
        editalId: data.editalId,
        proponenteId: data.proponenteId,
        status: 'RASCUNHO',
        categoria: data.categoria,
        campos: {},
      },
      select: { id: true, numero: true },
    })
  },

  updateConteudo(id: string, data: Prisma.InscricaoUpdateInput): Promise<InscricaoDetalhe> {
    return prisma.inscricao.update({ where: { id }, data, include: detalheInclude })
  },

  findDetalhe(id: string): Promise<InscricaoDetalhe | null> {
    return prisma.inscricao.findUnique({ where: { id }, include: detalheInclude })
  },

  findParaSubmit(id: string): Promise<InscricaoParaSubmit | null> {
    return prisma.inscricao.findUnique({ where: { id }, include: submitInclude })
  },

  marcarEnviada(id: string, submittedAt: Date) {
    return prisma.inscricao.update({
      where: { id },
      data: { status: 'ENVIADA', submittedAt },
      select: { numero: true, submittedAt: true },
    })
  },

  atualizarStatus(id: string, status: InscricaoStatus) {
    return prisma.inscricao.update({ where: { id }, data: { status }, select: { id: true } })
  },

  async listAdmin(query: { page: number; pageSize: number; editalId?: string; status?: string }) {
    const where: Prisma.InscricaoWhereInput = {}
    if (query.editalId) where.editalId = query.editalId
    if (query.status) where.status = query.status as InscricaoStatus

    const [items, total] = await Promise.all([
      prisma.inscricao.findMany({
        where,
        include: adminListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.inscricao.count({ where }),
    ])
    return { items, total }
  },

  async listByProponente(proponenteId: string, query: { page: number; pageSize: number }) {
    const where: Prisma.InscricaoWhereInput = { proponenteId }
    const [items, total] = await Promise.all([
      prisma.inscricao.findMany({
        where,
        include: proponenteListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.inscricao.count({ where }),
    ])
    return { items, total }
  },
}
