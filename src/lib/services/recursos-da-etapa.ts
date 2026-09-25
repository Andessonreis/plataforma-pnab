import type { InscricaoStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { recursoDecisaoLabel } from '@/lib/status-maps'

/** Decisão ausente é recurso ainda em análise; valor desconhecido aparece como veio. */
export function situacaoDe(decisao: string | null): string {
  if (decisao === null) return 'Em análise'
  return recursoDecisaoLabel[decisao] ?? decisao
}

/**
 * Recursos interpostos numa fase do edital e quantas inscrições entraram na
 * etapa. É a mesma leitura do extrato em PDF e da página pública do resultado
 * dos recursos: as duas contam os mesmos recursos, na mesma ordem.
 */
export async function buscarRecursosDaEtapa(editalId: string, fase: string, universo: InscricaoStatus[]) {
  const [recursos, totalInscricoes] = await Promise.all([
    prisma.recurso.findMany({
      where: { fase, inscricao: { editalId } },
      // O id desempata protocolos do mesmo instante: sem ele a ordem, e com ela o hash, poderia variar.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        createdAt: true,
        decisao: true,
        inscricao: {
          select: { numero: true, proponente: { select: { nome: true, cpfCnpj: true } } },
        },
      },
    }),
    prisma.inscricao.count({ where: { editalId, status: { in: universo } } }),
  ])
  return { recursos, totalInscricoes }
}
