import type { Edital } from '@prisma/client'
import type { EditalStatus } from '@shared/enums/edital-status'
import type { EditalDetalheDTO, EditalResumoDTO } from '@shared/dtos/editais.dto'

function decimalToNumber(d: Edital['valorTotal']): number | null {
  if (d === null || d === undefined) return null
  return typeof d === 'number' ? d : Number(d)
}

export function toEditalResumo(edital: Edital): EditalResumoDTO {
  return {
    id: edital.id,
    slug: edital.slug,
    titulo: edital.titulo,
    ano: edital.ano,
    status: edital.status as EditalStatus,
    resumo: edital.resumo,
    valorTotal: decimalToNumber(edital.valorTotal),
    categorias: edital.categorias,
    publishedAt: edital.publishedAt?.toISOString() ?? null,
    createdAt: edital.createdAt.toISOString(),
  }
}

export function toEditalDetalhe(edital: Edital): EditalDetalheDTO {
  return {
    ...toEditalResumo(edital),
    acoesAfirmativas: edital.acoesAfirmativas,
    regrasElegibilidade: edital.regrasElegibilidade,
    tiposProponentePermitidos: edital.tiposProponentePermitidos,
    cronograma: edital.cronograma,
    camposFormulario: edital.camposFormulario,
    etapasCustomizadas: edital.etapasCustomizadas,
    criteriosAvaliacao: edital.criteriosAvaliacao,
    tiposAnexo: edital.tiposAnexo,
    notaMinima: decimalToNumber(edital.notaMinima),
    desempate: edital.desempate,
    formulaAvaliacao: edital.formulaAvaliacao,
    conteudoAcessivel: edital.conteudoAcessivel,
    vagasContemplados: edital.vagasContemplados,
    vagasSuplentes: edital.vagasSuplentes,
    updatedAt: edital.updatedAt.toISOString(),
  }
}
