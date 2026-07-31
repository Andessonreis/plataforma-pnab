import { CarrosselArtes } from './carrossel-artes'
import { PainelEditais } from './painel-editais'
import type { SlideDestaque, EditalResumo } from './types'

interface AberturaProps {
  slides: SlideDestaque[]
  editais: EditalResumo[]
}

/**
 * Abertura do portal: arte em destaque e editais abertos lado a lado.
 *
 * Os dois blocos dividem a mesma tela de propósito — a pessoa precisa ver
 * quais editais estão abertos assim que acessa, além do que a arte anuncia.
 * O traçado do mapa de Irecê entra como textura de marca no fundo.
 */
export function Abertura({ slides, editais }: AberturaProps) {
  return (
    <section className="relative overflow-hidden bg-brand-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <CarrosselArtes slides={slides} />
          <PainelEditais editais={editais} />
        </div>
      </div>
    </section>
  )
}
