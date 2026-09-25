import type { Prisma } from '@prisma/client'
import type { Emissao } from '@/lib/documentos/emissao'
import type { ProjetoCompletoData } from '@/lib/pdf/projeto-completo'
import type { CampoFormulario } from '@/types/campo-formulario'

/** O que a inscrição precisa trazer do banco para virar o PDF do projeto completo. */
export const INCLUDE_PROJETO_COMPLETO = {
  proponente: {
    select: { id: true, nome: true, cpfCnpj: true, email: true, tipoProponente: true },
  },
  edital: { select: { titulo: true, ano: true, camposFormulario: true } },
  anexos: { select: { titulo: true, tipo: true, valido: true, url: true } },
} satisfies Prisma.InscricaoInclude

export type InscricaoDoProjeto = Prisma.InscricaoGetPayload<{
  include: typeof INCLUDE_PROJETO_COMPLETO
}>

/** Prisma Json pode retornar string em vez de objeto — parsear com segurança. */
function parseCampos(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

interface OpcoesProjeto {
  /** Situação impressa no PDF; quem chama decide o que o leitor pode ver. */
  status: string
  emissao: Emissao | null
}

/** Monta os dados do PDF do projeto completo a partir da inscrição carregada. */
export function montarDadosProjeto(
  inscricao: InscricaoDoProjeto,
  { status, emissao }: OpcoesProjeto,
): ProjetoCompletoData {
  const camposFormulario = Array.isArray(inscricao.edital.camposFormulario)
    ? (inscricao.edital.camposFormulario as unknown as CampoFormulario[])
    : []

  return {
    emissao,
    numero: inscricao.numero,
    status,
    proponente: {
      nome: inscricao.proponente.nome,
      cpfCnpj: inscricao.proponente.cpfCnpj ?? '',
      email: inscricao.proponente.email,
      tipoProponente: inscricao.proponente.tipoProponente ?? 'PF',
    },
    edital: { titulo: inscricao.edital.titulo, ano: inscricao.edital.ano },
    categoria: inscricao.categoria,
    campos: parseCampos(inscricao.campos),
    camposFormulario,
    anexos: inscricao.anexos,
    submittedAt: inscricao.submittedAt ?? inscricao.createdAt,
  }
}
