import type { EditalStatus } from '@prisma/client'
import { CRONOGRAMA_FASES_ORDENADAS } from '@/types/cronograma'

/**
 * Etapas do edital cujo prazo recursal o sistema registra e para as quais
 * emite extrato. Módulo sem dependências de servidor: a rota valida a query
 * com estas chaves e a tela monta os botões com estes rótulos.
 *
 * A janela de recurso das inscrições fica de fora: `Recurso.fase` não tem esse
 * valor, então o sistema não recebe recurso naquele prazo e o extrato não teria
 * o que comprovar.
 *
 * A etapa de seleção cobre `RESULTADO_PRELIMINAR` e `RESULTADO_FINAL`: o extrato
 * usa a fase cuja janela o cronograma cadastrou (`RECURSO_RESULTADO_JANELA` ou
 * `RECURSO_RESULTADO_FINAL_JANELA`), como no Festival, que só tem a segunda.
 *
 * Limitação: quando o edital cadastra as duas janelas, a etapa `selecao` emite
 * só o extrato do resultado preliminar (a primeira fase com janela); os recursos
 * contra o resultado final não têm extrato próprio nesse caso.
 */
export const ETAPAS_RECURSO_ROTULO = {
  habilitacao: 'Habilitação',
  selecao: 'Seleção',
} as const

export type EtapaRecurso = keyof typeof ETAPAS_RECURSO_ROTULO

export const ETAPAS_RECURSO_CHAVES = Object.keys(ETAPAS_RECURSO_ROTULO) as [
  EtapaRecurso,
  ...EtapaRecurso[],
]

/** Fase do edital a partir da qual o prazo de recursos da etapa pode ter terminado. */
const FASE_MINIMA: Record<EtapaRecurso, EditalStatus> = {
  habilitacao: 'HABILITACAO',
  selecao: 'RESULTADO_PRELIMINAR',
}

/**
 * A etapa já pode ter extrato a emitir? Antes da fase mínima o prazo ainda não
 * terminou e a emissão seria recusada, então a tela nem oferece o botão.
 */
export function etapaComExtrato(etapa: EtapaRecurso, statusEdital: EditalStatus): boolean {
  const fases = CRONOGRAMA_FASES_ORDENADAS
  return fases.indexOf(statusEdital) >= fases.indexOf(FASE_MINIMA[etapa])
}
