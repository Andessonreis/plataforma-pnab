/**
 * Motivos do sertão na linguagem de xilogravura da identidade SECULT.
 *
 * Complementam os ornamentos de composição (sol, casario, bandeirola) com as
 * figuras que a Secretaria repete nas peças: o mandacaru do símbolo, a sanfona
 * do forró, a ave, o umbuzeiro e a lua. Desenhados em SVG porque as artes
 * originais trazem marca d'água de banco de imagens e não podem ir para um
 * portal oficial — e porque em SVG escalam e recebem a cor de quem aplica.
 *
 * Nenhuma peça tem segunda cor: tudo é `currentColor` e o que seria detalhe
 * claro é recorte por `fill-rule`, mostrando a superfície de baixo. É o que
 * permite usar a mesma figura como silhueta de fundo sobre papel e como ícone
 * cheio sobre tinta.
 */

interface MotivoProps {
  className?: string
}

/** Circunferência como subcaminho — vira furo quando o pai usa `evenodd`. */
function furo(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`
}

/**
 * Mandacaru — o cacto que a identidade usa como símbolo da Secretaria.
 *
 * A haste central e os dois braços saem em alturas diferentes, como no
 * símbolo; os gomos são vazados no corpo, à maneira do entalhe.
 */
export function Mandacaru({ className = '' }: MotivoProps) {
  const haste = 'M32 14c-3.7 0-6.8 3-6.8 6.8V104h13.6V20.8C38.8 17 35.7 14 32 14Z'
  const bracoEsquerdo = 'M6 46A5.7 5.7 0 0 1 17.4 46V57H25.2V68.5H6Z'
  const bracoDireito = 'M58 51A5.7 5.7 0 0 0 46.6 51V62H38.8V73.5H58Z'
  const gomos = 'M30.4 30h3.2v16h-3.2ZM30.4 54h3.2v16h-3.2Z'

  return (
    <svg viewBox="0 0 64 104" className={className} role="presentation" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d={`${haste}${bracoEsquerdo}${bracoDireito}${gomos}`}
      />
    </svg>
  )
}

/** Passo entre as pregas do fole, na largura do viewBox da sanfona. */
const PREGAS = [32, 39, 46, 53, 60, 67, 74]

/**
 * Sanfona — o instrumento do forró, peça recorrente da comunicação da
 * Secretaria. Os dois teclados são blocos chapados com os botões vazados; o
 * fole é a repetição da mesma prega em V.
 */
export function Sanfona({ className = '' }: MotivoProps) {
  const teclado = 'M4 14C4 12 6 10 8 11L26 15V61L8 65C6 66 4 64 4 62Z'
  const baixos = 'M80 16L98 10C100 9 102 11 102 13V63C102 65 100 67 98 66L80 60Z'

  const botoesTeclado = [22, 32, 42, 52].flatMap((cy) => [furo(11, cy, 2.4), furo(19, cy + 5, 2.4)])
  const botoesBaixos = [24, 34, 44, 54].map((cy) => furo(91, cy, 2.6))

  return (
    <svg viewBox="0 0 108 76" className={className} role="presentation" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d={`${teclado}${botoesTeclado.join('')}`}
      />
      {PREGAS.map((x) => (
        <path key={x} fill="currentColor" d={`M${x} 10h6l-4.5 28 4.5 28h-6l-4.5-28Z`} />
      ))}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d={`${baixos}${botoesBaixos.join('')}`}
      />
    </svg>
  )
}

/**
 * Ave em voo, vista de frente — a silhueta que corta o céu nas peças.
 *
 * As asas sobem do corpo e afinam até a ponta, e entre elas fica o degrau do
 * dorso. É o degrau que faz a figura ser lida como ave: sem ele, duas curvas
 * simétricas viram estrela de quatro pontas.
 */
export function AveEmVoo({ className = '' }: MotivoProps) {
  return (
    <svg viewBox="0 0 100 50" className={className} role="presentation" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 30C20 18 34 14 44 24C47 27 53 27 56 24C66 14 80 18 96 30C80 26 68 24 58 32C53 36 47 36 42 32C32 24 20 26 4 30Z"
      />
    </svg>
  )
}

/**
 * Umbuzeiro na seca — a árvore da caatinga sem folha, desenhada em traço
 * aberto porque é assim que ela aparece nas artes: galho, não massa.
 */
export function Umbuzeiro({ className = '' }: MotivoProps) {
  const galhos = [
    'M50 72 32 56M32 56 22 40M32 56 16 50',
    'M50 64 68 48M68 48 78 32M68 48 84 42',
    'M50 60 42 42M42 42 34 28M42 42 48 30',
    'M50 60 60 44M60 44 68 30M60 44 56 30',
  ].join('')

  return (
    <svg viewBox="0 0 100 104" className={className} role="presentation" aria-hidden="true">
      <path
        d="M50 104V58"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d={galhos}
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Lua cortada — a foice de lua das peças noturnas. O vazio é a diferença entre
 * dois arcos, e não um segundo desenho por cima.
 */
export function LuaCortada({ className = '' }: MotivoProps) {
  return (
    <svg viewBox="0 0 84 96" className={className} role="presentation" aria-hidden="true">
      <path fill="currentColor" d="M56 6a42 42 0 1 0 0 84a34 42 0 1 1 0-84Z" />
    </svg>
  )
}
