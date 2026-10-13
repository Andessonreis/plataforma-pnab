'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { IconArrowRight } from '@/components/ui/icons'
import { SolEspiral } from '@/components/ui/ornamentos'
import { CHAMADA_PRIMARIA } from '../estilos-chamada'
import { RESPIRO_PONTOS } from '../quadro'
import { TexturaMapa } from '../textura-mapa'
import type { SlidePeca } from '../types'
import { FundoPeca } from './fundo-peca'
import { RetratoColado } from './retrato-colado'
import { VaralFotografias } from './varal-fotografias'

const ENTRADA = [0.2, 0.9, 0.25, 1] as const
const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300'

/**
 * Peça editorial que toma a faixa inteira da abertura (o Memorial é a primeira).
 *
 * A ideia é um álbum aberto: a fotografia em sépia ao fundo é o que já passou,
 * a foto colada em cor é o hoje e o varal embaixo guarda a linha do tempo. A
 * chamada é a voz da peça — em tipografia grande, porque é ela que carrega a
 * emoção, não um número ou um selo.
 *
 * As posições vêm de áreas de grid, e não de duas cópias da foto: no celular
 * ela encolhe e se encaixa ao lado do texto de apoio; do tablet em diante
 * ganha a coluna da direita. Foto e varal são opcionais no cadastro, e a peça
 * se recompõe sem eles.
 *
 * O movimento tem um só fio: tudo se revela. A chamada sobe de dentro de uma
 * máscara linha a linha, a foto se revela de sépia para cor e as cópias do
 * varal vêm uma a uma. Quem pede menos movimento recebe tudo já pronto.
 */
export function PalcoPeca({ slide }: { slide: SlidePeca }) {
  const parado = useReducedMotion() === true
  const { peca } = slide
  const linhas = [peca.chamada, peca.chamadaDestaque].filter((l): l is string => Boolean(l))
  // Chamada longa desce um degrau de tamanho: o quadro não cresce, então a
  // frase no limite de caracteres ainda precisa caber no celular.
  const tamanhoChamada =
    Math.max(...linhas.map((l) => l.length)) > 24
      ? 'text-[1.875rem] md:text-[2rem] lg:text-[2.625rem]'
      : 'text-[2.375rem] md:text-[3rem] lg:text-[3.25rem]'

  const subida = (atraso: number) =>
    parado
      ? {}
      : {
          initial: { transform: 'translateY(108%)' },
          animate: { transform: 'translateY(0%)' },
          transition: { duration: 0.8, delay: atraso, ease: ENTRADA },
        }

  const areas = peca.destaque
    ? "[grid-template-areas:'chamada_chamada'_'apoio_foto'_'botoes_botoes'_'linhas_linhas'] md:[grid-template-areas:'chamada_foto'_'apoio_foto'_'botoes_foto'_'linhas_foto']"
    : "[grid-template-areas:'chamada'_'apoio'_'botoes'_'linhas']"

  return (
    <div className="absolute inset-0">
      <FundoPeca src={peca.fundo} />
      <TexturaMapa />
      <SolEspiral className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 text-accent-300/15" />

      <div className={`relative mx-auto flex h-full max-w-7xl flex-col px-4 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pt-8 ${RESPIRO_PONTOS}`}>
        <div
          className={`grid content-start gap-x-5 ${areas} ${
            peca.destaque ? 'grid-cols-[minmax(0,1fr)_8.5rem] md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] md:gap-x-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-x-12' : ''
          }`}
        >
          <blockquote className="[grid-area:chamada]">
            <p className={`titulo text-balance leading-[1.02] text-papel-50 ${tamanhoChamada}`}>
              {linhas.map((linha, i) => (
                <span key={linha} className="block overflow-hidden pb-[0.06em]">
                  <motion.span className={`block ${i === 1 ? 'text-accent-300' : ''}`} {...subida(0.15 + i * 0.18)}>
                    {linha}
                  </motion.span>
                </span>
              ))}
            </p>
            {peca.autoria && (
              <footer className="mt-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-papel-100">
                <span className="h-px w-10 bg-accent-300" aria-hidden="true" />
                {peca.autoria}
              </footer>
            )}
          </blockquote>

          {(peca.apoioDestaque || peca.apoio) && (
            <p className="mt-3 line-clamp-4 self-center text-base leading-snug text-papel-50 [grid-area:apoio] md:line-clamp-2 md:self-start md:text-lg lg:max-w-xl">
              {peca.apoioDestaque && (
                <strong className="titulo tracking-wide text-accent-300">{peca.apoioDestaque}</strong>
              )}{' '}
              {peca.apoio}
            </p>
          )}

          {peca.destaque && (
            <div className="mt-3 self-center [grid-area:foto] md:mt-0">
              <RetratoColado destaque={peca.destaque} />
            </div>
          )}

          {/* No celular o segundo botão vira link sublinhado: os dois cabem numa
              linha só e a peça não estoura o quadro. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 [grid-area:botoes] md:mt-5 md:gap-x-3">
            <Link href={slide.ctaUrl} className={`${CHAMADA_PRIMARIA} min-h-12 hover:bg-accent-400 ${FOCO}`}>
              {slide.ctaLabel}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            {peca.ctaSecundario && (
              <Link
                href={peca.ctaSecundario.url}
                className={`inline-flex min-h-12 items-center gap-1 px-1 text-sm font-bold text-papel-50 underline decoration-accent-300 decoration-2 underline-offset-4 transition-colors hover:text-accent-200 md:rounded-sm md:border-2 md:border-papel-100/70 md:px-5 md:uppercase md:tracking-wider md:no-underline md:hover:bg-papel-50 md:hover:text-tinta-950 ${FOCO}`}
              >
                {peca.ctaSecundario.label}
              </Link>
            )}
          </div>

          {peca.linhas.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 text-sm text-papel-100 [grid-area:linhas]">
              {peca.linhas.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          )}
        </div>

        {peca.varal && (
          <div className="mt-auto pt-3">
            <VaralFotografias varal={peca.varal} />
          </div>
        )}
      </div>
    </div>
  )
}
