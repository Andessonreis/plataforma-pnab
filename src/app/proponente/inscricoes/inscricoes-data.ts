import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { statusVisivelParaProponente } from '@/lib/edital/resultado-habilitacao'
import { STATUS_BUCKETS, type StatusBucketKey } from './status-buckets'
import { proximoPasso } from './proximo-passo'
import type { InscricaoFicha } from './inscricao-item'

export const TAMANHO_PAGINA = 10

/** Página de inscrições do proponente já no formato de ficha, com o próximo passo resolvido. */
export async function carregarInscricoes(userId: string, bucketKey: StatusBucketKey, page: number) {
  const bucket = STATUS_BUCKETS[bucketKey]
  const where = {
    proponenteId: userId,
    ...(bucket.statuses ? { status: { in: bucket.statuses } } : {}),
  }

  const [inscricoes, totalFiltrado, totalGeral, contagemBruta, editaisAbertos] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TAMANHO_PAGINA,
      take: TAMANHO_PAGINA,
      select: {
        id: true,
        numero: true,
        categoria: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        resultadoLiberadoEm: true,
        edital: { select: { titulo: true, status: true, cronograma: true } },
        recursos: { select: { fase: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.count({ where: { proponenteId: userId } }),
    prisma.inscricao.groupBy({ by: ['status'], where: { proponenteId: userId }, _count: { _all: true } }),
    prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
  ])

  const fichas: InscricaoFicha[] = inscricoes.map((i) => {
    // Habilitação não publicada não aparece pro proponente: a inscrição segue
    // "Em análise" até o resultado sair no Diário Oficial.
    const status = statusVisivelParaProponente(i.status, i.resultadoLiberadoEm !== null) as InscricaoStatus
    return {
      id: i.id,
      numero: i.numero,
      categoria: i.categoria,
      status,
      submittedAt: i.submittedAt,
      createdAt: i.createdAt,
      editalTitulo: i.edital.titulo,
      passo: proximoPasso({
        id: i.id,
        status,
        editalStatus: i.edital.status,
        cronograma: i.edital.cronograma,
        fasesRecorridas: i.recursos.map((r) => r.fase),
      }),
    }
  })

  return {
    fichas,
    totalGeral,
    totalPaginas: Math.ceil(totalFiltrado / TAMANHO_PAGINA),
    contagemPorStatus: new Map(contagemBruta.map((c) => [c.status, c._count._all])),
    editaisAbertos,
  }
}
