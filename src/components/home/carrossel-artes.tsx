'use client'

import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { IconArrowRight } from '@/components/ui/icons'
import { BannerEdital } from './banner-edital'
import { CHAMADA_PRIMARIA } from './estilos-chamada'
import { variantesTroca } from './troca'
import type { SlideArte, SlideComposicao } from './types'

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400'

/**
 * Peça da esquerda na faixa dividida da abertura.
 *
 * Os dois tipos pedem tratamentos opostos. A composição é impressa direto sobre
 * a fotografia da faixa — sem moldura, porque emoldurá-la criava um quadro
 * dentro do quadro. A arte fechada, cadastrada no admin, é um arquivo com
 * margem e texto próprios: aparece inteira (`object-contain`), porque recortá-la
 * cortaria informação, e sem moldura: só a arte, alinhada à esquerda do quadro.
 *
 * Cada slide é uma camada inteira (peça e botão juntos) sobreposta à anterior,
 * então o rótulo do botão nunca troca antes da peça.
 */
export function CarrosselArtes({ slide }: { slide: SlideComposicao | SlideArte }) {
  const parado = useReducedMotion() === true

  return (
    <div className="relative min-h-0">
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          variants={variantesTroca(parado)}
          initial="entrando"
          animate="visivel"
          exit="saindo"
        >
          <Link href={slide.ctaUrl} className={`group flex h-full flex-col rounded-lg ${FOCO}`}>
            {slide.tipo === 'composicao' ? (
              <div className="min-h-0 flex-1">
                <BannerEdital {...slide.banner} />
              </div>
            ) : (
              <div className="min-h-0 flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.imagemUrl} alt={slide.titulo} className="h-full w-full object-contain object-left" />
              </div>
            )}
            <span className={`mt-4 self-start ${CHAMADA_PRIMARIA} min-h-12 group-hover:bg-accent-400`}>
              {slide.ctaLabel}
              <IconArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
