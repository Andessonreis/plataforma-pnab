import { CarrosselArtes } from './carrossel-artes'
import { FundoFotos } from '@/components/ui/fundo-fotos'
import { SolEspiral } from '@/components/ui/ornamentos'
import { PainelEditais } from './painel-editais'
import type { SlideDestaque, EditalResumo } from './types'

interface AberturaProps {
  slides: SlideDestaque[]
  editais: EditalResumo[]
  /** Fotografias que ocupam o fundo da faixa inteira. */
  fotos: string[]
}

/**
 * Abertura do portal: peça de destaque e editais abertos lado a lado.
 *
 * A fotografia é o fundo da faixa toda, não de um cartão dentro dela — a
 * abertura é a peça, e a peça tem a largura da página. A chamada e o painel
 * de editais são impressos por cima, como tinta sobre o papel. Os dois blocos
 * dividem a mesma tela de propósito: a pessoa precisa ver quais editais estão
 * abertos assim que acessa, além do que a chamada anuncia.
 *
 * O traçado do mapa de Irecê entra como textura de marca por cima de tudo.
 */
export function Abertura({ slides, editais, fotos }: AberturaProps) {
  return (
    <section className="relative overflow-hidden bg-brand-700">
      <FundoFotos fotos={fotos} />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      {/* Sangra pela quina de baixo, na diagonal oposta ao selo — sol nascendo
          no canto da faixa, e não um disco flutuando no meio dela. */}
      <SolEspiral className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 text-accent-300/20" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <CarrosselArtes slides={slides} />
          <PainelEditais editais={editais} />
        </div>
      </div>
    </section>
  )
}
