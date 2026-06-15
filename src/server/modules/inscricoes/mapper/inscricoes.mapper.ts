import type { Prisma } from '@prisma/client'
import type { InscricaoStatus } from '@shared/enums/inscricao-status'
import type {
  InscricaoAdminItemDTO,
  InscricaoDetalheDTO,
  InscricaoProponenteItemDTO,
} from '@shared/dtos/inscricoes.dto'
import type {
  InscricaoAdminItem,
  InscricaoDetalhe,
  InscricaoProponenteItem,
} from '../repository/inscricoes.repository'

function decimalToNumber(d: Prisma.Decimal | null): number | null {
  return d === null ? null : Number(d)
}

export function toInscricaoDetalhe(i: InscricaoDetalhe): InscricaoDetalheDTO {
  return {
    id: i.id,
    numero: i.numero,
    status: i.status as InscricaoStatus,
    categoria: i.categoria,
    campos: i.campos,
    orcamento: i.orcamento,
    notaFinal: decimalToNumber(i.notaFinal),
    posicao: i.posicao,
    motivoInabilitacao: i.motivoInabilitacao,
    submittedAt: i.submittedAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    edital: {
      id: i.edital.id,
      titulo: i.edital.titulo,
      slug: i.edital.slug,
      status: i.edital.status,
      categorias: i.edital.categorias,
      camposFormulario: i.edital.camposFormulario,
    },
    anexos: i.anexos.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      titulo: a.titulo,
      url: a.url,
      valido: a.valido,
      observacao: a.observacao,
      createdAt: a.createdAt.toISOString(),
    })),
    proponente: { id: i.proponente.id, nome: i.proponente.nome },
  }
}

export function toInscricaoAdminItem(i: InscricaoAdminItem): InscricaoAdminItemDTO {
  return {
    id: i.id,
    numero: i.numero,
    status: i.status as InscricaoStatus,
    categoria: i.categoria,
    notaFinal: decimalToNumber(i.notaFinal),
    submittedAt: i.submittedAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    editalTitulo: i.edital.titulo,
    proponenteNome: i.proponente.nome,
    proponenteCpfCnpj: i.proponente.cpfCnpj,
    totalAvaliacoes: i._count.avaliacoes,
    totalRecursos: i._count.recursos,
  }
}

export function toInscricaoProponenteItem(i: InscricaoProponenteItem): InscricaoProponenteItemDTO {
  return {
    id: i.id,
    numero: i.numero,
    status: i.status as InscricaoStatus,
    categoria: i.categoria,
    submittedAt: i.submittedAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    editalTitulo: i.edital.titulo,
    editalSlug: i.edital.slug,
    totalAnexos: i._count.anexos,
  }
}
