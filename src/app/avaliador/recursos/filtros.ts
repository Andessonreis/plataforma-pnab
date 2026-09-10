import type { Prisma } from '@prisma/client'

/** Situação de um recurso sob a ótica do avaliador que precisa opinar nele. */
export type SituacaoRecurso = 'pendentes' | 'respondidos' | 'decididos'

/**
 * Recursos das inscrições em que este avaliador está designado. O vínculo é a
 * avaliação: quem não avalia a inscrição não vê o recurso dela.
 */
export function whereInscricoesComRecurso(
  avaliadorId: string,
  editaisVisiveis: string[],
): Prisma.InscricaoWhereInput {
  return {
    avaliacoes: { some: { avaliadorId } },
    recursos: { some: {} },
    editalId: { in: editaisVisiveis },
  }
}

export function classificarRecurso(recurso: {
  decisao: string | null
  respostas: unknown[]
}): SituacaoRecurso {
  if (recurso.decisao) return 'decididos'
  return recurso.respostas.length > 0 ? 'respondidos' : 'pendentes'
}
