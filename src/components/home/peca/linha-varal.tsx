'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** Passo entre fotografias e dimensões de cada cópia, em unidades do viewBox. */
const PASSO = 36
const COPIA = { largura: 24, altura: 30 }
/** Altura justa: a cópia mais baixa (no meio do varal) termina em ~49 unidades. */
const ALTURA_VARAL = 52

/** Tons de sépia das cópias, da mais clara à mais queimada — variam para não virar carimbo. */
const TONS = ['fill-accent-800', 'fill-accent-700', 'fill-accent-900', 'fill-brand-800']

/**
 * Inclinação determinística de cada cópia. Não usa `Math.random` para o
 * servidor e o cliente desenharem o mesmo varal.
 */
const inclinacao = (i: number) => (((i * 7) % 5) - 2) * 1.8

interface LinhaVaralProps {
  quantidade: number
  /** Posição da primeira cópia no varal inteiro — mantém o ritmo da revelação entre linhas. */
  inicio?: number
  className?: string
}

/**
 * Uma linha de fotografias penduradas por pregadores. Cada cópia é revelada em
 * sequência, da esquerda para a direita, como se saíssem da cuba — o gesto que
 * dá nome à mostra "Re-Tratos do Tempo". As imagens aqui são cópias abstratas
 * (paisagem em sépia), não as fotografias da exposição: o acervo publicado é
 * mostrado nas páginas do Memorial, com crédito.
 */
export function LinhaVaral({ quantidade, inicio = 0, className = '' }: LinhaVaralProps) {
  const parado = useReducedMotion() === true
  const largura = quantidade * PASSO
  const altura = (x: number) => 5 + 12 * (1 - ((2 * x) / largura - 1) ** 2)

  return (
    <svg
      viewBox={`0 0 ${largura} ${ALTURA_VARAL}`}
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <path
        d={`M0 5 Q${largura / 2} 29 ${largura} 5`}
        fill="none"
        className="stroke-papel-100/60"
        strokeWidth="1.2"
      />
      {Array.from({ length: quantidade }, (_, i) => {
        const x = PASSO * i + PASSO / 2
        const n = inicio + i
        return (
          <g key={n} transform={`translate(${x} ${altura(x)}) rotate(${inclinacao(n)})`}>
            <rect x="-1.5" y="-2" width="3" height="7" rx="1" className="fill-papel-200" />
            <rect
              x={-COPIA.largura / 2}
              y="2"
              width={COPIA.largura}
              height={COPIA.altura}
              className="fill-papel-50"
            />
            <motion.g
              {...(parado
                ? {}
                : {
                    initial: { opacity: 0.08 },
                    animate: { opacity: 1 },
                    transition: { duration: 0.9, delay: 1 + n * 0.07, ease: 'easeOut' },
                  })}
            >
              <rect
                x={-COPIA.largura / 2 + 2}
                y="4"
                width={COPIA.largura - 4}
                height="19"
                className={TONS[n % TONS.length]}
              />
              <path
                d={`M${-COPIA.largura / 2 + 2} 23 L${-4 + (n % 3) * 3} ${13 + (n % 4)} L${2 + (n % 2) * 3} 19 L${COPIA.largura / 2 - 2} ${12 + (n % 3) * 2} V23 Z`}
                className="fill-tinta-950/45"
              />
            </motion.g>
          </g>
        )
      })}
    </svg>
  )
}
