import Image from 'next/image'
import { FadeIn } from '@/components/ui/animated'
import { Casario } from '@/components/ui/ornamentos'

/** Texto institucional da Secretaria, tal como definido na identidade visual. */
const MANIFESTO = [
  'Imagine uma terra que fala. Uma terra que não apenas sustenta o corpo, mas também a fala, o sonho e o gesto.',
  'Em Irecê, o chão é verbo e o povo é o sujeito que conjuga arte no tempo presente. A Secretaria de Cultura nasce com esse ouvido atento da cidade, que transforma o que vem do povo em imagem, cor, cena, som e sorrisos.',
]

/**
 * Identidade da Secretaria: manifesto ao lado de um par de fotos da cidade.
 * As fotos são verticais na origem e mantêm essa proporção, deslocadas entre
 * si para quebrar o alinhamento rígido do restante da página.
 */
export function SecaoConceito() {
  return (
    <section className="relative overflow-hidden bg-tinta-900 py-12 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeIn direction="right" className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-md border-2 border-papel-100/20">
                <Image
                  src="/images/secult/aerea-irece.jpg"
                  alt="Vista aérea da entrada de Irecê ao entardecer"
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-md border-2 border-papel-100/20 sm:mt-10">
                <Image
                  src="/images/secult/festa-irece.jpg"
                  alt="Público reunido em festa popular de Irecê"
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </div>
            </div>
          </FadeIn>

          <FadeIn className="order-1 lg:order-2">
            {/* Assinatura da Secretaria: símbolo oficial + texto real, para o
                nome ser lido por leitor de tela e indexado. */}
            <div className="mb-6 flex items-center gap-4">
              <Image
                src="/images/secult/simbolo-secult.png"
                alt=""
                width={659}
                height={800}
                className="h-16 w-auto shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="titulo text-lg leading-tight tracking-wide text-papel-50">
                  Secretaria de Cultura e Turismo
                </p>
                <p className="text-sm text-papel-200/70">Prefeitura de Irecê</p>
              </div>
            </div>

            <p className="mb-1 rotulo text-xs text-accent-300">Nosso conceito</p>
            <h2 className="mb-5 titulo text-2xl leading-tight tracking-wide text-papel-50 sm:text-3xl">
              Uma terra que fala
            </h2>

            {MANIFESTO.map((paragrafo) => (
              <p key={paragrafo.slice(0, 24)} className="mb-4 leading-relaxed text-papel-200">
                {paragrafo}
              </p>
            ))}

            <p className="border-l-4 border-accent-500 pl-4 rotulo text-xs leading-snug text-accent-200">
              Aqui, os mandacarus têm voz, as árvores secas recitam versos, e o sol não nasce
              apenas — ele estreia.
            </p>

            <Casario className="mt-8 h-16 w-auto text-papel-100/25" />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
