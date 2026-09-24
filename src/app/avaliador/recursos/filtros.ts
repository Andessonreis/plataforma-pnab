import type { Prisma } from '@prisma/client'

/** Situação de um recurso ainda em aberto, sob a ótica do avaliador que precisa opinar nele. */
export type SituacaoRecurso = 'pendentes' | 'respondidos'

/**
 * Recurso ativo é o que ainda não tem decisão consolidada. O decidido já passou
 * pelo colegiado (consenso ou desempate do admin) e sai da fila do avaliador.
 */
export const WHERE_RECURSO_ATIVO = { decisao: null } satisfies Prisma.RecursoWhereInput

/**
 * Inscrições com recurso ativo em que este avaliador está designado. O vínculo
 * é a avaliação: quem não avalia a inscrição não vê o recurso dela.
 */
export function whereInscricoesComRecurso(
  avaliadorId: string,
  editaisVisiveis: string[],
): Prisma.InscricaoWhereInput {
  return {
    avaliacoes: { some: { avaliadorId } },
    recursos: { some: WHERE_RECURSO_ATIVO },
    editalId: { in: editaisVisiveis },
  }
}

export function classificarRecurso(recurso: { respostas: unknown[] }): SituacaoRecurso {
  return recurso.respostas.length > 0 ? 'respondidos' : 'pendentes'
}
