/**
 * Helper de visualização para Avaliacao.
 *
 * Responsável por garantir que `notaTotal` só seja exibida quando a avaliação
 * estiver finalizada (e o valor não for null no banco). Centraliza a regra
 * para que UIs novas não exibam acidentalmente "0" para avaliações pendentes.
 *
 * Ver: bug #66 — distinguir "não avaliado" (null) de "avaliado e zerado" (0).
 */

type AvaliacaoLike = {
  notaTotal: unknown
  finalizada: boolean
}

/**
 * Retorna o número da nota total apenas se a avaliação estiver finalizada
 * e a nota não for null/undefined no banco. Caso contrário, retorna null.
 */
export function viewNotaTotal(av: AvaliacaoLike): number | null {
  if (!av.finalizada) return null
  if (av.notaTotal === null || av.notaTotal === undefined) return null
  const n = Number(av.notaTotal)
  return Number.isFinite(n) ? n : null
}

/**
 * Formata a nota total para exibição. Retorna 'Pendente' quando não houver
 * nota válida (placeholder ou rascunho).
 */
export function formatNotaTotal(av: AvaliacaoLike, decimals = 2): string {
  const n = viewNotaTotal(av)
  return n === null ? 'Pendente' : n.toFixed(decimals)
}
