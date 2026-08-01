import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'
import type { NoticiaListada } from './consulta'

interface MancheteProps {
  noticia: NoticiaListada
}

/**
 * A notícia mais recente, tratada como manchete de capa.
 *
 * O título vem antes da fotografia, como em qualquer capa: com a imagem em
 * cima ocupando a largura toda, a manchete só aparecia depois de meia tela de
 * rolagem, e a pessoa via a foto sem saber do que se tratava.
 *
 * Sem fotografia, a manchete é tipográfica: o título cresce e a chamada ganha
 * largura de leitura. É assim que uma capa impressa resolve a falta de
 * imagem, e é o motivo de não haver mais foto de reserva aqui.
 *
 * A composição anterior sempre exibia uma foto: sem `imagemUrl`, entrava a da
 * fogueira ou a das bandeirinhas com `alt` igual ao título, o que afirmava
 * que aquela imagem ilustrava aquela notícia.
 */
export function Manchete({ noticia }: MancheteProps) {
  const temFoto = Boolean(noticia.imagemUrl)

  return (
    <article className="border-t-2 border-tinta-900 pt-6">
      <Link
        href={`/noticias/${noticia.slug}`}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
      >
        <div className={temFoto ? '' : 'max-w-3xl'}>
          {noticia.dataPorExtenso && (
            <time
              dateTime={noticia.publicadoEmIso ?? undefined}
              className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700"
            >
              {noticia.dataPorExtenso}
            </time>
          )}

          <h2
            className={`mt-2 titulo leading-tight tracking-wide text-tinta-900 transition-colors group-hover:text-brand-700 ${
              temFoto ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-5xl'
            }`}
          >
            {noticia.titulo}
          </h2>
        </div>

        <div className={`mt-6 grid gap-6 lg:gap-10 ${temFoto ? 'lg:grid-cols-[1.6fr_1fr]' : 'max-w-3xl'}`}>
          {temFoto && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-tinta-900/5">
              {/* `img` cru, e não `next/image`: a URL vem do Storage e varia por
                  registro, então não há ganho de otimização previsível aqui. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={noticia.imagemUrl!}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-base leading-relaxed text-tinta-700">{noticia.chamada}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 lg:mt-auto lg:pt-6">
              {noticia.tags.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tinta-500">
                  {noticia.tags.slice(0, 4).join(' · ')}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                Ler notícia
                <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
