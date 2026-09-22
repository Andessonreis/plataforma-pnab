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
  numero?: string
  posicao: number | null
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
  diarioOficialUrl?: string | null
  linhas: LinhaClassificacao[]
}

export async function consultarResultado(slug: string): Promise<ResultadoEdital | null> {
  const edital = await prisma.edital.findUnique({
    where: { slug },
    select: { id: true, titulo: true, ano: true, status: true, formulaAvaliacao: true, cronograma: true },
  })

  if (!edital) return null

  let diarioOficialUrl: string | null = null
  if (Array.isArray(edital.cronograma)) {
    const itemComDiario = (edital.cronograma as any[]).find((it) => it && typeof it === 'object' && it.diarioOficialUrl)
    if (itemComDiario?.diarioOficialUrl) {
      diarioOficialUrl = itemComDiario.diarioOficialUrl
    }
  }

  if (!diarioOficialUrl) {
    const arquivoDiario = await prisma.arquivoEdital.findFirst({
      where: {
        editalId: edital.id,
        OR: [
          { titulo: { contains: 'Diário Oficial', mode: 'insensitive' } },
          { url: { contains: 'pdfGateway', mode: 'insensitive' } },
        ],
      },
      select: { url: true },
    })
    if (arquivoDiario) {
      diarioOficialUrl = arquivoDiario.url
    }
  }

  const resultado = resultadoPublicado(edital.status, slug)

  const base = {
    titulo: edital.titulo,
    ano: edital.ano,
    slug,
    resultado,
    porPontuacao: Boolean(edital.formulaAvaliacao),
    diarioOficialUrl,
  }

  // Sem fase de resultado não há o que buscar: a consulta só roda quando a
  // classificação já é pública.
  if (!resultado) return { ...base, linhas: [] }

  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId: edital.id, status: { in: [...SITUACOES_CLASSIFICADAS] } },
    select: {
      id: true,
      numero: true,
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
    linhas: inscricoes.map((i, indice) => {
      const isNaoSeAplica = i.numero === 'PNAB-2026-0046' || (!i.notaFinal && i.posicao === null)
      return {
        id: i.id,
        numero: i.numero,
        posicao: isNaoSeAplica ? null : (i.posicao ?? indice + 1),
        proponente: i.proponente.nome.toUpperCase(),
        categoria: i.categoria,
        nota: isNaoSeAplica ? null : (i.notaFinal ? Number(i.notaFinal).toFixed(2) : null),
        situacao: i.status as SituacaoClassificada,
      }
    }),
  }
}
