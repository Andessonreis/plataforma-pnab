import Link from 'next/link'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'

export interface ExposicaoResumo {
  id: string
  slug: string
  titulo: string
  subtitulo: string | null
  periodo: string | null
  localizacao: string | null
  capaUrl: string | null
}

/**
 * Exposições em faixas largas, capa e texto lado a lado e alternando de lado — como
 * as salas de um percurso, não como cartões de catálogo.
 */
export function ListaExposicoes({ exposicoes, tituloNivel = 'h3' }: { exposicoes: ExposicaoResumo[]; tituloNivel?: 'h2' | 'h3' }) {
  const Titulo = tituloNivel

  return (
    <ul className="space-y-10 sm:space-y-14">
      {exposicoes.map((e, i) => (
        <li key={e.id}>
          <Link
            href={`/memorial/exposicoes/${e.slug}`}
            className="group grid items-center gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 sm:grid-cols-2 sm:gap-10"
          >
            <div className={`relative aspect-[4/3] overflow-hidden bg-tinta-900/10 ${i % 2 === 1 ? 'sm:order-2' : ''}`}>
              {e.capaUrl && (
                <ImagemMemorial
                  src={e.capaUrl}
                  alt=""
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              )}
            </div>
            <div>
              {e.periodo && <p className="text-sm font-semibold text-brand-700">{e.periodo}</p>}
              <Titulo className="titulo mt-2 text-3xl leading-tight text-tinta-900 group-hover:text-brand-700 sm:text-4xl">
                {e.titulo}
              </Titulo>
              {e.subtitulo && <p className="mt-3 max-w-md text-base leading-relaxed text-tinta-700">{e.subtitulo}</p>}
              {e.localizacao && <p className="mt-3 text-sm text-tinta-600">{e.localizacao}</p>}
              <span className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 underline underline-offset-4">
                Visitar a exposição
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
