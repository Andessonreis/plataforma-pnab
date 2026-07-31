import Link from 'next/link'
import type { NoticiaListada } from './consulta'

interface EntradaNoticiaProps {
  noticia: NoticiaListada
}

/**
 * Uma notícia na coluna de leitura, sem moldura de cartão.
 *
 * Os cartões brancos com sombra e elevação no hover obrigavam toda notícia a
 * ter foto de topo, e a maioria não tem — daí a imagem de reserva. Aqui a
 * entrada é regida por um fio superior e pela linha de data, como verbete de
 * jornal: a fotografia entra como miniatura quando existe, e a ausência dela
 * não deixa buraco nenhum na composição.
 */
export function EntradaNoticia({ noticia }: EntradaNoticiaProps) {
  return (
    <article className="border-t border-tinta-900/15 transition-colors hover:border-accent-500">
      <Link
        href={`/noticias/${noticia.slug}`}
        className="group flex gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        <div className="min-w-0 flex-1">
          {noticia.dataPorExtenso && (
            <time
              dateTime={noticia.publicadoEmIso ?? undefined}
              className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-tinta-500"
            >
              {noticia.dataPorExtenso}
            </time>
          )}

          <h3 className="mt-1.5 titulo text-lg leading-snug tracking-wide text-tinta-900 transition-colors group-hover:text-brand-700">
            {noticia.titulo}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-tinta-600">
            {noticia.chamada}
          </p>

          {noticia.tags.length > 0 && (
            <p className="mt-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-tinta-500">
              {noticia.tags.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>

        {noticia.imagemUrl && (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-tinta-900/5 sm:h-28 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={noticia.imagemUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </Link>
    </article>
  )
}
