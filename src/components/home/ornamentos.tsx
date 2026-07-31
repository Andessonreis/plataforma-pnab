/**
 * Ornamentos autorais na linguagem de xilogravura da identidade SECULT.
 *
 * Desenhados em SVG porque as peças equivalentes das artes de divulgação
 * trazem marca d'água de banco de imagens e não podem ir para um portal
 * oficial. Em SVG também escalam e recebem cor da paleta via `currentColor`.
 */

import type { CSSProperties } from 'react'

interface OrnamentoProps {
  className?: string
}

const RAIOS = 12

/**
 * Salto entre raios na ordem de entalhe. Precisa ser coprimo de `RAIOS` para
 * percorrer todos sem repetir — 5 desenha uma estrela de doze pontas.
 */
const PASSO_ENTALHE = 5

/**
 * Sol em espiral, motivo recorrente da identidade.
 *
 * Todo o traço usa `currentColor` — nenhuma cor fixa — para que o ornamento
 * herde a opacidade de quem o aplica e não vire uma mancha sólida quando
 * usado como marca d'água.
 *
 * Ao montar, o desenho se entalha: espiral e anel são cortados por
 * `stroke-dashoffset` e cada raio é batido no salto definido acima. As regras
 * moram em `globals.css` (`.entalhe-*`), inclusive a saída para quem pede
 * menos movimento. `pathLength={1}` normaliza o comprimento das curvas para
 * que uma única regra de dash sirva às duas.
 */
export function SolEspiral({ className = '' }: OrnamentoProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="presentation" aria-hidden="true">
      {Array.from({ length: RAIOS }, (_, i) => (
        // O giro fica no grupo: a animação usa `transform` do CSS, que
        // sobrescreveria o atributo se estivessem no mesmo elemento.
        <g key={i} transform={`rotate(${(i / RAIOS) * 360} 50 50)`}>
          <polygon
            className="entalhe-raio"
            style={{ '--i': (i * PASSO_ENTALHE) % RAIOS } as CSSProperties}
            points="50,6 55,24 45,24"
            fill="currentColor"
          />
        </g>
      ))}
      <path
        className="entalhe-traco"
        style={{ '--i': 0 } as CSSProperties}
        pathLength={1}
        d="M50 36 A14 14 0 1 1 36 50 A14 14 0 1 0 64 50 A10 10 0 1 1 50 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        className="entalhe-traco"
        style={{ '--i': 1 } as CSSProperties}
        pathLength={1}
        cx="50"
        cy="50"
        r="27"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  )
}

/**
 * Casario sertanejo — fachadas geminadas com platibanda, porta e janelas,
 * silhueta típica das ruas antigas de Irecê.
 */
export function Casario({ className = '' }: OrnamentoProps) {
  // x inicial, largura e altura de cada fachada da fileira
  const casas = [
    { x: 0, largura: 62, altura: 54 },
    { x: 62, largura: 74, altura: 66 },
    { x: 136, largura: 58, altura: 48 },
    { x: 194, largura: 66, altura: 60 },
  ]
  const base = 90

  return (
    <svg viewBox="0 0 260 100" className={className} role="presentation" aria-hidden="true">
      {casas.map((casa) => {
        const topo = base - casa.altura
        const meio = casa.x + casa.largura / 2
        return (
          <g key={casa.x} fill="currentColor">
            {/* corpo da fachada */}
            <rect x={casa.x + 2} y={topo} width={casa.largura - 4} height={casa.altura} />
            {/* platibanda recortada */}
            <rect x={casa.x} y={topo - 7} width={casa.largura} height={7} />
            <rect x={meio - 4} y={topo - 13} width={8} height={7} />
            {/* porta e janelas vazadas */}
            <rect
              x={meio - 7}
              y={base - 26}
              width={14}
              height={26}
              fill="#ebe2c9"
              opacity="0.92"
            />
            <rect
              x={casa.x + 8}
              y={topo + 13}
              width={11}
              height={13}
              fill="#ebe2c9"
              opacity="0.92"
            />
            <rect
              x={casa.x + casa.largura - 19}
              y={topo + 13}
              width={11}
              height={13}
              fill="#ebe2c9"
              opacity="0.92"
            />
          </g>
        )
      })}
      {/* calçada */}
      <rect x="0" y={base} width="260" height="5" fill="currentColor" />
    </svg>
  )
}
