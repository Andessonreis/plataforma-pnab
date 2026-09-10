import type { Prisma } from '@prisma/client'
import { EDITAL_STATUS_COM_AVALIACAO } from '@/lib/services/avaliacao-buckets'

/**
 * Recorte das inscrições sob a ótica do avaliador logado: o que ele ainda não
 * abriu, o que está em rascunho de nota e o que ele já fechou. É diferente dos
 * buckets do gestor (`avaliacao-buckets`), que olham o progresso do colegiado
 * inteiro — aqui só conta a avaliação deste avaliador.
 */

export type AbaAvaliador = 'a_avaliar' | 'em_avaliacao' | 'avaliadas'

export const ABAS_AVALIADOR: Record<AbaAvaliador, string> = {
  a_avaliar: 'A avaliar',
  em_avaliacao: 'Em avaliação',
  avaliadas: 'Avaliadas',
}

export function isAbaAvaliador(valor: string | undefined): valor is AbaAvaliador {
  return !!valor && valor in ABAS_AVALIADOR
}

/** Inscrições que chegaram à fase de avaliação nos editais da equipe do avaliador. */
export function whereInscricoesDoAvaliador(editaisVisiveis: string[]): Prisma.InscricaoWhereInput {
  return {
    status: { notIn: ['RASCUNHO', 'INABILITADA'] },
    editalId: { in: editaisVisiveis },
    edital: { status: { in: EDITAL_STATUS_COM_AVALIACAO } },
  }
}

export function whereAba(aba: AbaAvaliador, avaliadorId: string): Prisma.InscricaoWhereInput {
  switch (aba) {
    case 'a_avaliar':
      return { avaliacoes: { none: { avaliadorId } } }
    case 'em_avaliacao':
      return { avaliacoes: { some: { avaliadorId, finalizada: false } } }
    case 'avaliadas':
      return { avaliacoes: { some: { avaliadorId, finalizada: true } } }
  }
}

/** Classifica uma inscrição já carregada com as avaliações deste avaliador. */
export function classificarMinhaAvaliacao(avaliacoes: { finalizada: boolean }[]): AbaAvaliador {
  if (avaliacoes.length === 0) return 'a_avaliar'
  return avaliacoes.some((a) => a.finalizada) ? 'avaliadas' : 'em_avaliacao'
}
