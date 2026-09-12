import Image from 'next/image'
import { Cartela } from '@/components/ui/cartela'
import { Casario, LuaEspiral } from '@/components/ui/ornamentos'

/** Texto institucional da Secretaria, tal como definido na identidade visual. */
const MANIFESTO = [
  'Imagine uma terra que fala. Uma terra que não apenas sustenta o corpo, mas também a fala, o sonho e o gesto.',
  'Em Irecê, o chão é verbo e o povo é o sujeito que conjuga arte no tempo presente. A Secretaria de Cultura nasce com esse ouvido atento da cidade, que transforma o que vem do povo em imagem, cor, cena, som e sorrisos.',
]

/**
 * Colagem de fotos reais com bloco de cor por trás, deslocado — o mesmo
 * recurso dos cartazes da comunicação municipal (não uma moldura ao redor da
 * foto: um cartão sólido espiando atrás dela, à direita e embaixo).
 */
const FOTOS_CONCEITO = [
  {
    src: '/images/secult/aerea-irece.jpg',
    alt: 'Vista aérea da entrada de Irecê ao entardecer',
    bloco: 'bg-brand-600',
    className: 'left-0 top-10 w-[46%] -rotate-3',
  },
  {
    src: '/images/galeria/foto-03.png',
    alt: 'Quadrilha dançando no arraiá do São João de Irecê',
    bloco: 'bg-turquesa-600',
    className: 'right-0 top-0 w-[44%] rotate-2',
  },
  {
    src: '/images/secult/festa-irece.jpg',
    alt: 'Público reunido em festa popular de Irecê',
    bloco: 'bg-oliva-600',
    className: 'left-[27%] top-[38%] w-[44%] rotate-1',
  },
] as const

/**
 * Identidade da Secretaria: manifesto ao lado de três fotos do acervo da
 * cidade, empilhadas como Polaroid — paradas, não em esteira. A ideia de
 * fotos passando ficou mais desconexa do que interessante aqui: a home já
 * tem duas esteiras (dia a dia, notícias) fazendo esse papel de movimento; a
 * assinatura da Secretaria pede um respiro parado, não mais uma faixa que
 * rola.
 */
export function SecaoConceito() {
  return (
    <section className="relative overflow-hidden bg-tinta-900 py-14 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-screen"
        style={{
          backgroundImage: 'url(/images/secult/mapa-irece.png)',
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
        }}
        aria-hidden="true"
      />

      <LuaEspiral className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 text-accent-500/20 sm:h-64 sm:w-64" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:gap-20 lg:px-8">
        <div className="relative order-2 mx-auto aspect-square w-full max-w-sm lg:order-1 lg:aspect-[4/5] lg:max-w-none">
          {FOTOS_CONCEITO.map((foto) => (
            <figure key={foto.src} className={`absolute ${foto.className}`}>
              <span
                className={`absolute inset-0 translate-x-3 translate-y-3 rounded-2xl ${foto.bloco}`}
                aria-hidden="true"
              />
              <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </span>
            </figure>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          {/* Assinatura da Secretaria: símbolo oficial + texto real, para o
              nome ser lido por leitor de tela e indexado. */}
          <div className="mb-6 flex items-center gap-4">
            <Image
              src="/images/secult/simbolo-secult.png"
              alt=""
              width={659}
              height={800}
              className="h-16 w-auto shrink-0 [transform:translateZ(0)]"
              aria-hidden="true"
              priority
            />
            <div>
              <p className="titulo text-lg leading-tight tracking-wide text-papel-50">
                Secretaria de Cultura e Turismo
              </p>
              <p className="text-sm text-papel-200/70">Prefeitura de Irecê</p>
            </div>
          </div>

          <Cartela cor="terracota" className="mb-5">
            Nosso conceito
          </Cartela>
          <p className="mb-6 titulo text-3xl leading-[0.95] tracking-wide text-papel-50 sm:text-5xl">
            Uma terra que fala
          </p>

          {MANIFESTO.map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)} className="mb-4 max-w-xl leading-relaxed text-papel-200">
              {paragrafo}
            </p>
          ))}

          <p className="max-w-xl border-l-4 border-accent-500 pl-4 rotulo text-xs leading-snug text-accent-200">
            Aqui, os mandacarus têm voz, as árvores secas recitam versos, e o sol não nasce
            apenas — ele estreia.
          </p>

          <Casario className="mt-8 h-16 w-auto text-papel-100/25" />
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-accent-500" aria-hidden="true" />
    </section>
  )
}
