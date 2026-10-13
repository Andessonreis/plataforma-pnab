import { FundoFotos } from '@/components/ui/fundo-fotos'
import { SolEspiral } from '@/components/ui/ornamentos'
import { CarrosselArtes } from './carrossel-artes'
import { PainelEditais } from './painel-editais'
import { RESPIRO_PONTOS } from './quadro'
import { TexturaMapa } from './textura-mapa'
import type { EditalResumo, SlideArte, SlideComposicao } from './types'

interface FaixaDivididaProps {
  slide: SlideComposicao | SlideArte
  editais: EditalResumo[]
  fotos: string[]
}

/**
 * Arranjo da abertura em que a peça divide o quadro com o painel de editais.
 *
 * A fotografia é o fundo da faixa toda, não de um cartão dentro dela; a peça e
 * o painel são impressos por cima, como tinta sobre o papel. No celular a peça
 * fica com o espaço que sobra acima do painel (`1fr`), por isso ela precisa
 * saber se encolher — a altura do quadro não cresce para acomodá-la.
 */
export function FaixaDividida({ slide, editais, fotos }: FaixaDivididaProps) {
  return (
    <div className="absolute inset-0">
      <FundoFotos fotos={fotos} />
      <TexturaMapa />

      {/* Sangra pela quina de baixo, na diagonal oposta ao selo — sol nascendo
          no canto da faixa, e não um disco flutuando no meio dela. */}
      <SolEspiral className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 text-accent-300/20" />

      <div className={`relative mx-auto h-full max-w-7xl px-4 pt-6 sm:px-6 md:pt-9 lg:px-8 lg:pt-10 ${RESPIRO_PONTOS}`}>
        <div className="grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-5 md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:gap-8 lg:gap-10">
          <CarrosselArtes slide={slide} />
          <PainelEditais editais={editais} />
        </div>
      </div>
    </div>
  )
}
