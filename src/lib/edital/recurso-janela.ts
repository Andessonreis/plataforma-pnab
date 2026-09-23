import type { AcaoJanela } from '@/types/cronograma'

/**
 * Fase do recurso → ação do cronograma que abre e fecha o prazo dela.
 *
 * Estava duplicado em três lugares (tela do proponente, rota do proponente e
 * service do v1), e as cópias divergiram: a fase RESULTADO_FINAL ficou de fora
 * de todas, então o prazo de recurso contra a alocação de vagas nunca fechava.
 * Um mapa só, importado pelos três, mantém UI e API contando a mesma história.
 *
 * Fase ausente aqui = sem janela configurável (prazo sempre aberto). Hoje não
 * há nenhuma: as três fases de recurso têm ação própria.
 */
export const RECURSO_FASE_TO_JANELA: Record<string, AcaoJanela> = {
  HABILITACAO: 'RECURSO_HABILITACAO_JANELA',
  RESULTADO_PRELIMINAR: 'RECURSO_RESULTADO_JANELA',
  RESULTADO_FINAL: 'RECURSO_RESULTADO_FINAL_JANELA',
}

/**
 * Ação que gateia a fase, ou `null` quando a fase não tem janela.
 *
 * `null` significa prazo sempre aberto — e `janelaParaAcao` devolvendo `null`
 * (cronograma sem item com a ação) também. Os dois casos são permissivos de
 * propósito: um edital antigo, cadastrado antes das janelas existirem, não
 * pode ter o recurso bloqueado retroativamente.
 */
export function acaoJanelaDaFase(fase: string): AcaoJanela | null {
  return RECURSO_FASE_TO_JANELA[fase] ?? null
}
