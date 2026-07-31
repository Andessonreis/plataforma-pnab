'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRotacao } from './use-rotacao'

interface PalavrasRotativasProps {
  palavras: string[]
  className?: string
  /** Tempo que cada palavra fica em tela. */
  intervaloMs?: number
}

/**
 * Alterna uma palavra por vez, batida como carimbo de rolete.
 *
 * A troca é curta e assenta torto→reto em vez de deslizar na vertical: o
 * deslize é o vocabulário de carrossel de site, e aqui o movimento precisa
 * falar a mesma língua do resto da peça, que é impressão (ver `BannerEdital`).
 *
 * A largura da caixa é reservada pela palavra mais longa, renderizada
 * invisível na mesma célula do grid — sem isso o texto ao redor pula a cada
 * troca. Para leitor de tela a lista inteira é lida de uma vez e o trecho
 * animado fica oculto: reanunciar a cada troca atrapalharia a navegação.
 */
export function PalavrasRotativas({
  palavras,
  className = '',
  intervaloMs = 2400,
}: PalavrasRotativasProps) {
  const reduzirMovimento = useReducedMotion()
  const [indice] = useRotacao({ total: palavras.length, intervaloMs })

  if (palavras.length === 0) return null

  const maisLonga = palavras.reduce((maior, palavra) =>
    palavra.length > maior.length ? palavra : maior,
  )
  const atual = palavras[indice]

  return (
    <span className={`relative inline-grid align-bottom leading-[1.25] ${className}`}>
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">
        {maisLonga}
      </span>

      {/* Sem `mode="wait"`: a palavra que sai e a que entra se cruzam. Em
          espera havia um intervalo com a linha vazia — "Fomento para" sozinho
          no ar. Elas se sobrepõem em absoluto para uma não empurrar a outra. */}
      <span className="relative col-start-1 row-start-1" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.span
            key={atual}
            className="absolute left-0 top-0 origin-left whitespace-nowrap"
            initial={
              reduzirMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.86, rotate: -2.5 }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={reduzirMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {atual}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="sr-only">{palavras.join(', ')}</span>
    </span>
  )
}
