'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { imagemExterna, type PecaEditorial } from './tipos'

/** Fita adesiva que prende a fotografia ao álbum. */
export function Fita({ className }: { className: string }) {
  return (
    <span
      className={`absolute h-4 w-10 bg-accent-200/75 shadow-[0_1px_2px_rgba(0,0,0,0.25)] md:h-6 md:w-16 ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * Cópia fotográfica presa com fita, levemente torta — a "foto colada" da peça.
 *
 * É o "hoje" da peça: o fundo está em sépia e esta foto entra em cor — começa
 * escura e dessaturada e se revela devagar, como uma revelação de papel. A
 * imagem enviada no admin é recortada em 3:2 pelo `object-cover`, então quem
 * cadastra precisa deixar o assunto no centro.
 */
export function RetratoColado({ destaque }: { destaque: NonNullable<PecaEditorial['destaque']> }) {
  const parado = useReducedMotion() === true

  return (
    <motion.figure
      className="relative mx-auto w-full rotate-2 bg-papel-50 p-1.5 pb-2 shadow-[0_22px_34px_-14px_rgba(0,0,0,0.7)] md:max-w-[19rem] md:p-3 lg:max-w-[24rem]"
      {...(parado
        ? {}
        : {
            initial: { opacity: 0, y: 18, rotate: -3 },
            animate: { opacity: 1, y: 0, rotate: 2 },
            transition: { duration: 0.7, delay: 0.45, ease: [0.2, 0.9, 0.25, 1] },
          })}
    >
      <Fita className="-left-3 -top-1.5 -rotate-[32deg] md:-left-5 md:-top-2" />
      <Fita className="-right-3 -top-1.5 rotate-[32deg] md:-right-5 md:-top-2" />

      <motion.div
        className="relative aspect-[3/2] overflow-hidden bg-tinta-900"
        {...(parado
          ? {}
          : {
              initial: { filter: 'sepia(1) brightness(0.45) saturate(0.6)' },
              animate: { filter: 'sepia(0) brightness(1) saturate(1)' },
              transition: { duration: 2.6, delay: 1, ease: 'easeOut' },
            })}
      >
        <Image
          src={destaque.url}
          alt={destaque.alt}
          fill
        unoptimized={imagemExterna(destaque.url)}
          sizes="(min-width: 1024px) 24rem, (min-width: 768px) 19rem, 9rem"
          className="object-cover"
        />
      </motion.div>

      {destaque.legenda && (
        <figcaption className="truncate px-0.5 pt-1.5 text-sm font-semibold leading-tight text-tinta-800 md:pt-2.5 md:uppercase md:tracking-[0.14em]">
          {destaque.legenda}
        </figcaption>
      )}
    </motion.figure>
  )
}
