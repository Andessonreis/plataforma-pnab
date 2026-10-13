'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BotaoPausa } from './botao-pausa'
import { FaixaDividida } from './faixa-dividida'
import { PalcoPeca } from './peca/palco-peca'
import { PontosCarrossel } from './pontos-carrossel'
import { ALTURA_QUADRO } from './quadro'
import { variantesTroca } from './troca'
import { useAutoplay } from './use-autoplay'
import type { SlideDestaque, EditalResumo } from './types'

interface AberturaProps {
  slides: SlideDestaque[]
  editais: EditalResumo[]
  /** Fotografias que ocupam o fundo da faixa dos editais. */
  fotos: string[]
  /** Ritmo da troca, configurado pela Comunicação no painel de slides. */
  carrossel: { intervaloSegundos: number; automatico: boolean }
}

/**
 * Abertura do portal: um quadro de altura fixa onde os destaques se revezam.
 *
 * Há dois arranjos dentro do quadro. A faixa dividida (slide institucional e
 * artes do admin) põe a peça ao lado do painel de editais, para a pessoa ver o
 * que está aberto assim que chega. A peça editorial ocupa a faixa inteira. Entre
 * slides da faixa dividida só a peça da esquerda troca — fotos e painel ficam.
 *
 * Por baixo de tudo há tinta escura, não a cor da marca: se algum quadro da
 * troca deixasse o fundo à mostra, apareceria sombra, não um clarão terracota.
 * Os pontos ficam fora das camadas, no mesmo lugar em qualquer slide.
 *
 * Quem pede menos movimento não recebe troca automática: os slides mudam só
 * pelos pontos.
 */
export function Abertura({ slides, editais, fotos, carrossel }: AberturaProps) {
  const parado = useReducedMotion() === true
  const automatico = carrossel.automatico && !parado && slides.length > 1
  const { atual, irPara, pausadoPelaPessoa, alternarPausa, suspender } = useAutoplay({
    total: slides.length,
    intervaloMs: carrossel.intervaloSegundos * 1000,
    ativo: automatico,
  })
  const slide = slides[atual]
  if (!slide) return null

  const camada = slide.tipo === 'peca' ? slide.id : 'faixa-dividida'

  return (
    <section
      className={`relative isolate overflow-hidden bg-tinta-950 ${ALTURA_QUADRO}`}
      onMouseEnter={() => suspender(true)}
      onMouseLeave={() => suspender(false)}
      onFocusCapture={() => suspender(true)}
      onBlurCapture={() => suspender(false)}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      data-quadro-abertura
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={camada}
          className="absolute inset-0"
          variants={variantesTroca(parado)}
          initial="entrando"
          animate="visivel"
          exit="saindo"
          role="group"
          aria-roledescription="slide"
          aria-label={`${atual + 1} de ${slides.length}: ${slide.titulo}`}
        >
          {slide.tipo === 'peca' ? (
            <PalcoPeca slide={slide} />
          ) : (
            <FaixaDividida slide={slide} editais={editais} fotos={fotos} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-auto flex items-center gap-2">
            <PontosCarrossel total={slides.length} atual={atual} onSelecionar={irPara} />
            {automatico && <BotaoPausa pausado={pausadoPelaPessoa} onAlternar={alternarPausa} />}
          </div>
        </div>
      </div>
    </section>
  )
}
