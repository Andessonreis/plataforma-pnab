import type { CSSProperties } from 'react'
import { IconInstagram } from '@/components/ui'
import type { MomentoResumo } from './types'

interface SecaoDiaADiaProps {
  momentos: MomentoResumo[]
}

const INSTAGRAM_URL = 'https://www.instagram.com/secult.irece/'

interface TrilhaMomentosProps {
  momentos: MomentoResumo[]
  decorativa?: boolean
}

function TrilhaMomentos({ momentos, decorativa = false }: TrilhaMomentosProps) {
  return (
    <ul className="flex shrink-0 items-start gap-8 pr-8 sm:gap-10 sm:pr-10" aria-hidden={decorativa || undefined}>
      {momentos.map((momento) => (
        <li key={momento.id} className="flex w-32 shrink-0 sm:w-40">
          <a
            href={momento.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={decorativa ? -1 : undefined}
            aria-label={decorativa ? undefined : `Ver "${momento.categoria}" no Instagram da Secretaria`}
            className="group block rounded-full ring-[3px] ring-accent-500 ring-offset-4 ring-offset-papel-50 transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
          >
            <span className="block aspect-square w-32 overflow-hidden rounded-full border-2 border-papel-50 bg-tinta-900/5 sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={momento.imagemUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Quantas vezes repetir a trilha até uma "volta" ficar larga o bastante pra
 * não sobrar vão em branco antes do loop fechar numa tela grande. Com só
 * quatro momentos cadastrados, duas cópias (a conta de toda esteira até
 * aqui) ficam mais estreitas que a tela — daí o salto que aparecia no fim.
 * Quanto mais a Secretaria cadastrar, menos cópias isso pede sozinho.
 */
function copiasNecessarias(itens: number): number {
  return Math.max(2, Math.ceil(20 / itens))
}

/**
 * O dia a dia da Secretaria como esteira contínua, não quatro fotos soltas.
 * A trilha real se repete em loop fechado (mesmo mecanismo do conceito, eixo
 * horizontal aqui) — sem inventar foto que não existe, só fazendo as fotos
 * reais circularem o suficiente pra cobrir a tela em qualquer resolução.
 * Sem seção, some sozinha (nenhum momento publicado ainda).
 */
export function SecaoDiaADia({ momentos }: SecaoDiaADiaProps) {
  if (momentos.length === 0) return null

  const copias = copiasNecessarias(momentos.length)

  return (
    <section className="relative overflow-hidden bg-papel-50 py-10 sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h2 className="titulo text-2xl leading-tight tracking-wide text-tinta-900 sm:text-3xl">
            O dia a dia da Secretaria
          </h2>
          <p className="mt-2 leading-relaxed text-tinta-700">
            Fotos das ações, avisos de atendimento e os encontros dos programas ficam no nosso
            perfil.
          </p>
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-sm bg-accent-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-tinta-950 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 sm:self-auto"
        >
          <IconInstagram className="h-4 w-4" />
          Seguir no Instagram
        </a>
      </div>

      {/* Esteira: sangra a largura toda; a trilha é duplicada pra o loop fechar sem salto.
          Janela em `hidden` com movimento ligado — só a animação move o conteúdo, sem a
          rolagem nativa do dedo/trackpad brigando com ela e estourando o loop. */}
      <div className="esteira-janela-x mt-8 sm:mt-10">
        <div
          className="animar-esteira-x flex w-max py-2"
          style={
            {
              // Duração acompanha o conteúdo real (não as cópias decorativas),
              // pra a velocidade da esteira não mudar conforme o admin cadastra
              // mais ou menos momentos.
              '--duracao-esteira': `${Math.max(12, momentos.length * 5)}s`,
              '--esteira-desloc': `${-100 / copias}%`,
            } as CSSProperties
          }
        >
          <TrilhaMomentos momentos={momentos} />
          {Array.from({ length: copias - 1 }, (_, i) => (
            <TrilhaMomentos key={i} momentos={momentos} decorativa />
          ))}
        </div>
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-turquesa-700" aria-hidden="true" />
    </section>
  )
}
