'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRotacao } from '@/components/ui/use-rotacao'

interface FundoFotosProps {
  /** Caminhos em `/public`. A ordem é a da exibição. */
  fotos: string[]
}

/** Permanência de cada foto. Longa de propósito: é pano de fundo, não conteúdo. */
const PERMANENCIA_MS = 6500

/** Travessia lenta o bastante para não puxar o olho do texto. */
const TRAVESSIA_S = 1.8

/**
 * Fotografias da cultura de Irecê no fundo da faixa de abertura.
 *
 * As fotos passam por um banho de tinta terracota em `multiply` antes de
 * chegar ao olho: sem isso cada uma traz sua própria temperatura — o azul das
 * saias de quadrilha, o neon do arraiá — e o banner viraria uma colagem. Com o
 * banho, todas viram a mesma tinta e a peça continua sendo uma peça só.
 *
 * O degradê por cima segura a leitura do que é impresso na faixa — a chamada
 * à esquerda e o painel de editais à direita — sem apagar a fotografia.
 * São decorativas (`aria-hidden`): quem lê por leitor de tela recebe a mesma
 * mensagem pelo texto do banner, e anunciar "foto de festa" a cada 6s seria
 * ruído. Quem pede menos movimento fica com a primeira foto, parada.
 */
export function FundoFotos({ fotos }: FundoFotosProps) {
  const reduzirMovimento = useReducedMotion()
  const [indice] = useRotacao({
    total: fotos.length,
    intervaloMs: PERMANENCIA_MS,
    pausado: reduzirMovimento === true,
  })

  if (fotos.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={fotos[indice]}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRAVESSIA_S, ease: 'easeInOut' }}
        >
          <Image
            src={fotos[indice]}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority={indice === 0}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-brand-800/50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-tinta-950/80 via-tinta-950/40 to-tinta-950/65" />
    </div>
  )
}
