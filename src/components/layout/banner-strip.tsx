'use client'

import { useState } from 'react'
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

function BannerStrip({ banners }: BannerStripProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = banners.filter((b) => !dismissed.has(b.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-0">
      <AnimatePresence>
        {visible.map((banner) => (
          <motion.div
            key={banner.id}
            className="bg-accent-600 text-white overflow-hidden"
            role="alert"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center gap-3 py-2.5 text-sm">
                {/* Ícone com pulso sutil */}
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

                <p className="font-medium">
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

                {/* Botão fechar */}
                <button
                  onClick={() => setDismissed((prev) => new Set(prev).add(banner.id))}
                  className="shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors ml-1"
                  aria-label="Fechar aviso"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export { BannerStrip }
