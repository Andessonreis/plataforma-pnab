import { prisma } from '@/lib/db'

/**
 * Lista de classificação como o portal a expõe ao público.
 *
 * O resultado preliminar é um ato datado: depois do recurso as notas e as
 * vagas mudam, mas a lista que circulou no Diário Oficial continua sendo a
 * publicada naquele dia. Por isso ele é guardado no edital quando publicado
 * (`resultadoPreliminar`) e a página do preliminar lê a cópia, enquanto a do
 * resultado definitivo lê as inscrições como estão.
 */

/** Situações que já entram na lista pública de classificação. */
export const SITUACOES_CLASSIFICADAS = [
  'RESULTADO_PRELIMINAR',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
  'RECURSO_ABERTO',
] as const

export type SituacaoClassificada = (typeof SITUACOES_CLASSIFICADAS)[number]

/**
 * Inscrições que aparecem na lista mas ficam fora da classificação: sem posição
 * nem nota, com a situação "Não se aplica". A PNAB-2026-0046 é pessoa jurídica
 * inscrita numa categoria que o edital do Festival não tem; o resultado
 * preliminar a publicou assim, e recalcular as notas a promoveria a contemplada.
 */
export const INSCRICOES_FORA_DA_CLASSIFICACAO: readonly string[] = ['PNAB-2026-0046']

export interface LinhaResultadoPublico {
  numero: string
  /** Posição na categoria; nula para quem ficou fora da classificação. */
  posicao: number | null
  proponente: string
  categoria: string | null
  nota: string | null
  situacao: SituacaoClassificada
}

export interface ResultadoPreliminarGuardado {
  publicadoEm: string
  linhas: LinhaResultadoPublico[]
}

/** Lista atual do edital, agrupável por categoria: categoria, depois posição. */
export async function linhasDoResultado(editalId: string): Promise<LinhaResultadoPublico[]> {
  const inscricoes = await prisma.inscricao.findMany({
    where: { editalId, status: { in: [...SITUACOES_CLASSIFICADAS] } },
    select: {
      numero: true,
      posicao: true,
      categoria: true,
      notaFinal: true,
      status: true,
      proponente: { select: { nome: true } },
    },
    orderBy: [
      { categoria: 'asc' },
      { posicao: { sort: 'asc', nulls: 'last' } },
      { notaFinal: { sort: 'desc', nulls: 'last' } },
    ],
  })

  return inscricoes.map((i) => {
    const foraDaClassificacao = INSCRICOES_FORA_DA_CLASSIFICACAO.includes(i.numero)
    return {
      numero: i.numero,
      posicao: foraDaClassificacao ? null : i.posicao,
      proponente: i.proponente.nome.toUpperCase(),
      categoria: i.categoria,
      nota: !foraDaClassificacao && i.notaFinal ? Number(i.notaFinal).toFixed(2) : null,
      situacao: i.status as SituacaoClassificada,
    }
  })
}

/** Congela a lista atual como o resultado preliminar publicado do edital. */
export async function guardarResultadoPreliminar(editalId: string, publicadoEm: Date = new Date()): Promise<void> {
  const guardado: ResultadoPreliminarGuardado = {
    publicadoEm: publicadoEm.toISOString(),
    linhas: await linhasDoResultado(editalId),
  }
  await prisma.edital.update({ where: { id: editalId }, data: { resultadoPreliminar: guardado as object } })
}

/** Lê a cópia guardada; devolve null quando não existe ou não tem a forma esperada. */
export function lerResultadoPreliminar(bruto: unknown): ResultadoPreliminarGuardado | null {
  if (typeof bruto !== 'object' || bruto === null) return null
  const { publicadoEm, linhas } = bruto as Partial<ResultadoPreliminarGuardado>
  if (typeof publicadoEm !== 'string' || !Array.isArray(linhas)) return null
  return { publicadoEm, linhas }
}
