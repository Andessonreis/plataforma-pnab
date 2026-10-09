'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Fita } from '../peca/retrato-colado'

interface FotoReveladaProps {
  src: string
  alt: string
  legenda: string
}

/**
 * Fotografia colada no álbum que sai do sépia para a cor quando entra na tela —
 * o mesmo gesto de revelação da peça do Memorial na abertura, aqui disparado
 * pela rolagem, uma vez só. Quem pede menos movimento vê a foto já revelada.
 */
export function FotoRevelada({ src, alt, legenda }: FotoReveladaProps) {
  const parado = useReducedMotion() === true

  return (
    <figure className="relative mx-auto w-full max-w-md -rotate-1 bg-papel-50 p-3 pb-4 shadow-[0_24px_40px_-18px_rgba(25,14,7,0.55)] lg:max-w-none">
      <Fita className="-left-4 -top-2 -rotate-[30deg]" />
      <Fita className="-right-4 -top-2 rotate-[30deg]" />
      <motion.div
        className="relative aspect-[4/3] overflow-hidden bg-tinta-900"
        {...(parado
          ? {}
          : {
              initial: { filter: 'sepia(1) brightness(0.55) saturate(0.6)' },
              whileInView: { filter: 'sepia(0) brightness(1) saturate(1)' },
              viewport: { once: true, amount: 0.3 },
              transition: { duration: 2.2, ease: [0.23, 1, 0.32, 1] },
            })}
      >
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
      </motion.div>
      <figcaption className="px-0.5 pt-3 text-sm font-semibold uppercase tracking-[0.14em] text-tinta-800">
        {legenda}
      </figcaption>
    </figure>
  )
}
