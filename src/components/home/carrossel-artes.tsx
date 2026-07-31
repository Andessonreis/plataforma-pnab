'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { IconArrowRight } from '@/components/ui/icons'
import { BannerEdital } from './banner-edital'
import { useRotacao } from './use-rotacao'
import type { SlideDestaque } from './types'

interface CarrosselArtesProps {
  slides: SlideDestaque[]
}

/** Ritmo lento de leitura: a peça traz texto que precisa ser lido antes de trocar. */
const AUTOPLAY_MS = 12000

/**
 * Carrossel de destaques da abertura.
 *
 * Aceita dois tipos de slide: composições montadas em componente e artes
 * fechadas cadastradas no admin. As artes são exibidas inteiras
 * (`object-contain`) sobre fundo sólido — recortá-las cortava informação.
 * A transição é crossfade puro: qualquer deslocamento horizontal fazia a
 * peça anterior vazar pela lateral durante a troca.
 */
export function CarrosselArtes({ slides }: CarrosselArtesProps) {
  const [pausado, setPausado] = useState(false)
  const total = slides.length
  const [atual, setAtual] = useRotacao({ total, intervaloMs: AUTOPLAY_MS, pausado })

  if (total === 0) return null
  const slide = slides[atual]

  return (
    <div
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques"
    >
      <Link
        href={slide.ctaUrl}
        className="group block overflow-hidden rounded-lg border-2 border-papel-100/25 bg-tinta-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        {/* No celular o 16/10 dá uma faixa de ~245px, curta demais para a
            composição, que empilha chamada e valor — daí o piso de altura.
            Os slides se sobrepõem em absoluto, então a caixa precisa ter
            altura própria: não dá para deixar o conteúdo esticá-la. */}
        <div className="relative min-h-[23rem] sm:min-h-0 sm:aspect-[16/10]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {slide.tipo === 'composicao' ? (
                <BannerEdital {...slide.banner} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slide.imagemUrl}
                  alt={slide.titulo}
                  className="h-full w-full object-contain"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-4 bg-tinta-900 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-papel-100">{slide.titulo}</p>
            {slide.subtitulo && (
              <p className="truncate text-xs text-papel-200/70">{slide.subtitulo}</p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-accent-500 px-3 py-2 text-xs font-bold uppercase tracking-wider text-tinta-950 transition-colors group-hover:bg-accent-400">
            {slide.ctaLabel}
            <IconArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>

      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setAtual(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === atual ? 'w-7 bg-accent-400' : 'w-2.5 bg-papel-100/35 hover:bg-papel-100/60'
              }`}
              aria-label={`Ver destaque ${i + 1} de ${total}`}
              aria-current={i === atual ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
