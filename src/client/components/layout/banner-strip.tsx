'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface BannerData {
  id: string
  titulo: string
  texto: string
  ctaLabel: string | null
  ctaUrl: string | null
}

interface BannerStripProps {
  banners: BannerData[]
}

const INTERVAL_MS = 6000

function BannerStrip({ banners }: BannerStripProps) {
  const [dismissed, setDismissed] = useState(false)
  const [current, setCurrent] = useState(0)

  const visible = banners
  const total = visible.length

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + total) % total)
  }, [total])

  // Rotação automática
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(next, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [next, total])

  if (dismissed || total === 0) return null

  const banner = visible[current]

  return (
    <div className="bg-accent-600 text-white overflow-hidden" role="alert">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 py-2.5 text-sm">
          {/* Setas de navegação (só com múltiplos banners) */}
          {total > 1 && (
            <button
              onClick={prev}
              className="shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Banner anterior"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Conteúdo do banner com transição */}
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              className="flex items-center justify-center gap-3 min-w-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <motion.svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </motion.svg>

              <p className="font-medium truncate">
                <span className="font-semibold">{banner.titulo}</span>
                {banner.texto && (
                  <span className="hidden sm:inline"> — {banner.texto}</span>
                )}
              </p>

              {banner.ctaUrl && banner.ctaLabel && (
                <Link
                  href={banner.ctaUrl}
                  className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors min-h-[32px] inline-flex items-center"
                >
                  {banner.ctaLabel}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Indicadores de posição */}
          {total > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 ml-1" aria-label={`Banner ${current + 1} de ${total}`}>
              {visible.map((_, i) => (
                <button
                  key={visible[i].id}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Ir para banner ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Seta próximo */}
          {total > 1 && (
            <button
              onClick={next}
              className="shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Próximo banner"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Fechar */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors ml-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Fechar avisos"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export { BannerStrip }
