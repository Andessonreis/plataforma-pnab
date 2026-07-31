'use client'

import Image from 'next/image'
import { motion, useReducedMotion, type MotionProps } from 'framer-motion'
import { CountUp } from '@/components/ui/animated'
import { PalavrasRotativas } from './palavras-rotativas'

export interface BannerEditalProps {
  /** Chamada principal, em três partes para destacar o nome do programa. */
  chamadaInicio: string
  chamadaDestaque: string
  chamadaFim: string
  /** Rótulo fixo antes das linguagens, ex.: "Fomento para". */
  linguagensRotulo: string
  /** Linguagens culturais que se alternam na chamada. */
  linguagens: string[]
  /** Bloco de valor, ex.: "MAIS DE" / R$ 400 "MIL" / "EM RECURSOS". */
  valorPrefixo: string
  valorNumero: number
  valorUnidade: string
  valorSufixo: string
}

/**
 * Batida de matriz: o bloco desce torto, encosta no papel e assenta reto.
 * A escala parte de cima de 1 porque a matriz chega perto do olho antes de
 * tocar — deslizar de baixo para cima é o gesto de tela, não o de impressão.
 *
 * Cada bloco carrega o próprio atraso em vez de herdar um `staggerChildren`
 * do pai: a orquestração por variantes deixava de propagar quando o
 * `AnimatePresence` das fotos passou a viver dentro do mesmo pai, e os blocos
 * ficavam presos em `opacity: 0`.
 */
function batida(atraso: number, parado: boolean): MotionProps {
  if (parado) return {}
  return {
    initial: { opacity: 0, scale: 1.06, rotate: -0.8 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: 0.34, delay: atraso, ease: [0.2, 0.9, 0.25, 1] },
  }
}

/**
 * Peça de divulgação dos editais, impressa sobre a fotografia da faixa.
 *
 * A arte anterior era um JPEG com todo o texto embutido: não era lida por
 * leitor de tela, perdia nitidez ao escalar e só podia ser atualizada
 * refazendo o arquivo. Aqui o texto é conteúdo real e as cores saem da
 * paleta SECULT — a arte antiga usava laranja e magenta de outra campanha,
 * que destoavam do restante da página.
 *
 * Não tem fundo próprio: o papel é a fotografia que a `Abertura` põe atrás da
 * faixa inteira. Dar um fundo a esta peça criava um quadro dentro do quadro.
 *
 * O movimento segue a mesma metáfora da faixa — imprimir: os blocos são
 * batidos no papel e o valor conta a partir de zero. Nada gira em laço nem
 * esmaece. Como o componente é remontado a cada volta do carrossel, a
 * impressão acontece de novo sem controle de estado externo.
 *
 * O selo da PNAB é marca federal e entra como imagem, sem alteração.
 */
export function BannerEdital({
  chamadaInicio,
  chamadaDestaque,
  chamadaFim,
  linguagensRotulo,
  linguagens,
  valorPrefixo,
  valorNumero,
  valorUnidade,
  valorSufixo,
}: BannerEditalProps) {
  const parado = useReducedMotion() === true

  return (
    <div className="relative flex h-full flex-col justify-between py-1">
      <motion.div {...batida(0.1, parado)} className="relative flex justify-start">
        <Image
          src="/images/marca/selo-pnab.png"
          alt="Política Nacional Aldir Blanc — PNAB Cultura Irecê"
          width={612}
          height={294}
          className="h-auto w-[52%] max-w-[248px] rounded-sm"
          priority
        />
      </motion.div>

      {/* Uma lâmina de tinta só, assinatura inclusa: solta sobre a foto, a
          assinatura ficava à mercê do que passasse atrás e não dava para
          garantir contraste. Dentro do bloco, ela está sempre sobre tinta. */}
      <motion.div
        {...batida(0.26, parado)}
        className="relative mt-4 rounded-sm bg-tinta-900/95 px-4 py-3.5 sm:px-5 sm:py-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr] sm:gap-5">
          <div>
            <p className="text-lg leading-tight text-papel-50 sm:text-xl">
              {chamadaInicio}{' '}
              <strong className="titulo tracking-wide text-accent-300">{chamadaDestaque}</strong>{' '}
              {chamadaFim}
            </p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-papel-200/85">
              {linguagensRotulo}
              <PalavrasRotativas
                palavras={linguagens}
                className="titulo text-base text-accent-300 sm:text-lg"
              />
            </p>
          </div>

          <div className="border-papel-100/25 sm:border-l sm:pl-5">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-300">
              {valorPrefixo}
            </p>
            <p className="titulo text-2xl leading-none text-papel-50 sm:text-3xl">
              R$ <CountUp value={valorNumero} className="inline-block" /> {valorUnidade}
            </p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-papel-200">
              {valorSufixo}
            </p>
          </div>
        </div>

        <p className="mt-3.5 border-t border-papel-100/15 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-papel-100/85">
          Secretaria de Cultura e Turismo · Prefeitura de Irecê
        </p>
      </motion.div>
    </div>
  )
}
