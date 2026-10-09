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
 * margem e texto próprios: ganha caixa opaca e aparece inteira
 * (`object-contain`), porque recortá-la cortaria informação.
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
          {slide.tipo === 'composicao' ? (
            <Link href={slide.ctaUrl} className={`group flex h-full flex-col rounded-lg ${FOCO}`}>
              <div className="min-h-0 flex-1">
                <BannerEdital {...slide.banner} />
              </div>
              <span className={`mt-4 self-start ${CHAMADA_PRIMARIA} min-h-12 group-hover:bg-accent-400`}>
                {slide.ctaLabel}
                <IconArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ) : (
            <Link
              href={slide.ctaUrl}
              className={`group flex h-full flex-col overflow-hidden rounded-lg border-2 border-papel-100/25 bg-tinta-950 ${FOCO}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.imagemUrl} alt={slide.titulo} className="min-h-0 w-full flex-1 object-contain" />
              <div className="flex items-center justify-between gap-4 bg-tinta-900 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-papel-100">{slide.titulo}</p>
                  {slide.subtitulo && <p className="truncate text-sm text-papel-200/80">{slide.subtitulo}</p>}
                </div>
                <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm bg-accent-500 px-3 text-sm font-bold uppercase tracking-wider text-tinta-950 transition-colors group-hover:bg-accent-400">
                  {slide.ctaLabel}
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
