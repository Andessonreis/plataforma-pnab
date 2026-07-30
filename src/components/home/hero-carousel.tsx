'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons'

export interface SlideData {
  id: string
  tipo: 'hero' | 'edital' | 'noticia' | 'custom'
  titulo: string
  subtitulo?: string
  descricao: string
  imagemUrl?: string | null
  badge?: string
  badgeVariant?: 'success' | 'warning' | 'neutral'
  ctaLabel: string
  ctaUrl: string
  ctaSecondaryLabel?: string
  ctaSecondaryUrl?: string
  isImageOnly?: boolean
}

interface HeroCarouselProps {
  slides: SlideData[]
}

const AUTOPLAY_MS = 6000
const SWIPE_THRESHOLD = 50

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
}

function getBadgeClasses(variant?: 'success' | 'warning' | 'neutral') {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30'
    case 'warning':
      return 'bg-amber-500/20 text-amber-100 border-amber-400/30'
    default:
      return 'bg-white/15 text-white/90 border-white/20'
  }
}

// Fotos reais para slides sem imagem
function getEditalFallbackImage(index: number) {
  const images = [
    '/images/banner/foto_site (3).png',
    '/images/banner/foto_site (4).png',
    '/images/banner/foto_site (5).png',
    '/images/banner/foto_site (6).png',
    '/images/banner/foto_site (2).png',
  ]
  return images[index % images.length]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)

  const total = slides.length

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
    },
    [current],
  )

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((p) => (p - 1 + total) % total)
  }, [total])

  // Autoplay
  useEffect(() => {
    if (total <= 1 || paused) return
    const timer = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [next, total, paused])

  // Swipe
  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) next()
    else if (info.offset.x > SWIPE_THRESHOLD) prev()
  }

  if (total === 0) return null

  const slide = slides[current]
  const isHero = slide.tipo === 'hero'
  const isImageOnly = slide.isImageOnly || slide.imagemUrl?.includes('novo_editais')
  const bgImage = slide.imagemUrl || getEditalFallbackImage(current)

  return (
    <section
      className="relative text-white overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques"
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          drag={total > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          className="relative min-h-[300px] sm:min-h-[480px] lg:min-h-[560px]"
        >
          {isImageOnly && slide.imagemUrl ? (
            /* Banner puro: sem textos sobrepostos ou escurecimento por gradiente */
            <Link
              href={slide.ctaUrl}
              className="relative w-full min-h-[300px] sm:min-h-[480px] lg:min-h-[560px] flex items-center justify-center bg-[#800539] overflow-hidden group cursor-pointer"
              title={slide.titulo}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imagemUrl}
                alt={slide.titulo}
                className="w-full h-full object-contain max-h-[600px] transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </Link>
          ) : (
            <>
              {/* Imagem de fundo real (outros slides) */}
              <img
                src={bgImage}
                alt={slide.titulo}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              {/* Overlay escuro para garantir legibilidade dos textos sobre a foto */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

              {/* Conteúdo sobreposto */}
              <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-28 lg:py-32 flex items-center min-h-[480px] sm:min-h-[600px]">
                <div className={isHero ? 'max-w-3xl' : 'max-w-2xl'}>
                  {slide.badge && (
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 ${getBadgeClasses(slide.badgeVariant)}`}
                    >
                      {slide.badge}
                    </span>
                  )}

                  {isHero ? (
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                      {slide.titulo}
                      {slide.subtitulo && (
                        <>
                          <br />
                          {slide.subtitulo}
                        </>
                      )}
                    </h1>
                  ) : (
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
                      {slide.titulo}
                    </h2>
                  )}

                  {slide.descricao && (
                    <p className={`mt-4 sm:mt-6 leading-relaxed text-white/85 ${
                      isHero ? 'text-lg sm:text-xl max-w-2xl' : 'text-base sm:text-lg max-w-xl'
                    }`}>
                      {slide.descricao}
                    </p>
                  )}

                  <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4">
                    <Link
                      href={slide.ctaUrl}
                      className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600 transition-colors min-h-[44px]"
                    >
                      {slide.ctaLabel}
                    </Link>
                    {slide.ctaSecondaryLabel && slide.ctaSecondaryUrl && (
                      <Link
                        href={slide.ctaSecondaryUrl}
                        className="inline-flex items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25 transition-colors min-h-[44px]"
                      >
                        {slide.ctaSecondaryLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Setas (desktop) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center h-11 w-11 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors z-20"
            aria-label="Slide anterior"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center h-11 w-11 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors z-20"
            aria-label="Próximo slide"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'h-3 w-8 bg-white'
                  : 'h-3 w-3 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir para slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
