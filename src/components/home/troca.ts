import type { Variants } from 'framer-motion'

/**
 * easeInOutSine (easings.net). A cúbica concentrava a troca em ~300ms no meio
 * da curva e parecia um corte; a senoide espalha a mistura pelos 900ms.
 */
const CURVA_TROCA = [0.37, 0, 0.63, 1] as const

/**
 * Troca entre slides por sobreposição. A camada que entra fica por cima e vai
 * de 0 a 1; a que sai desce para baixo e continua opaca até a nova cobri-la.
 * Assim nunca existe um instante com as duas meio transparentes — era isso que
 * deixava o fundo da faixa aparecer como um clarão no meio da troca.
 *
 * A saída é um apagar instantâneo com atraso igual à entrada, e não "manter
 * opacidade 1": o framer encerra na hora uma animação cujo valor final é igual
 * ao atual, e a camada antiga sumiria no primeiro quadro.
 *
 * Quem pede menos movimento recebe a mesma troca, só que curta.
 */
/** Duração da troca em segundos; a leitura do slide só começa a contar depois dela. */
export const DURACAO_TROCA_S = 0.9

export function variantesTroca(parado: boolean): Variants {
  const duracao = parado ? 0.25 : DURACAO_TROCA_S
  return {
    entrando: { opacity: 0, zIndex: 1 },
    visivel: { opacity: 1, zIndex: 1, transition: { duration: duracao, ease: CURVA_TROCA } },
    saindo: {
      opacity: 0,
      zIndex: 0,
      transition: { opacity: { delay: duracao, duration: 0.01 }, zIndex: { duration: 0 } },
    },
  }
}
