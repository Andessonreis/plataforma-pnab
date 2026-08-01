import { prisma } from '@/lib/db'
import { resultadoPublicado, type ResultadoPublicado } from '../../resultado-publicado'

/** Situações que já entram na lista pública de classificação. */
const SITUACOES_CLASSIFICADAS = [
  'RESULTADO_PRELIMINAR',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
  'RECURSO_ABERTO',
] as const

export type SituacaoClassificada = (typeof SITUACOES_CLASSIFICADAS)[number]

export interface LinhaClassificacao {
  id: string
  posicao: number
  proponente: string
  categoria: string | null
  nota: string | null
  situacao: SituacaoClassificada
}

export interface ResultadoEdital {
  titulo: string
  ano: number
  slug: string
  /** `null` quando a fase do edital ainda não expõe classificação. */
  resultado: ResultadoPublicado | null
  /** Verdadeiro quando o edital usa fórmula — muda o rótulo da coluna. */
  porPontuacao: boolean
  linhas: LinhaClassificacao[]
}

export async function consultarResultado(slug: string): Promise<ResultadoEdital | null> {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { id: true, titulo: true, ano: true, status: true, formulaAvaliacao: true },
  })

  if (!edital) return null

  const resultado = resultadoPublicado(edital.status, slug)

  const base = {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    resultado,
    porPontuacao: Boolean(edital.formulaAvaliacao),
  }

  // Sem fase de resultado não há o que buscar: a consulta só roda quando a
  // classificação já é pública.
  if (!resultado) return { ...base, linhas: [] }

  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId: edital.id, status: { in: [...SITUACOES_CLASSIFICADAS] } },
    select: {
      id: true,
      posicao: true,
      categoria: true,
      notaFinal: true,
      status: true,
      proponente: { select: { nome: true } },
    },
    orderBy: [
      { posicao: { sort: 'asc', nulls: 'last' } },
      { notaFinal: { sort: 'desc', nulls: 'last' } },
    ],
  })

  return {
    ...base,
    linhas: inscricoes.map((i, indice) => ({
      id: i.id,
      posicao: i.posicao ?? indice + 1,
      proponente: i.proponente.nome.toUpperCase(),
      categoria: i.categoria,
      nota: i.notaFinal ? Number(i.notaFinal).toFixed(2) : null,
      situacao: i.status as SituacaoClassificada,
    })),
  }
}
