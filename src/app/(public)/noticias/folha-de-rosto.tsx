import Link from 'next/link'
import { FundoFotos } from '@/components/ui/fundo-fotos'

interface FolhaDeRostoProps {
  total: number
  ultimaPublicacao: string | null
}

const FOTOS = [
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/galeria/foto-04.png', // fogueira do São João
]

/**
 * Abertura do noticiário.
 *
 * A data da última publicação vale mais do que a contagem total: numa página
 * de notícias, o que a pessoa quer saber ao chegar é se há coisa nova, não
 * quantas existem no arquivo.
 */
export function FolhaDeRosto({ total, ultimaPublicacao }: FolhaDeRostoProps) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-papel-100">
      <FundoFotos fotos={FOTOS} />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-tinta-950/90 via-tinta-950/70 to-tinta-950/25"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
        <nav aria-label="Trilha de navegação" className="mb-8 text-xs tracking-wide text-papel-200/80">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-50">Notícias</span>
        </nav>

        <p className="mb-1 -rotate-1 font-caveat text-2xl text-accent-300">O que anda acontecendo</p>
        <h1 className="font-rye text-3xl leading-tight tracking-wide text-papel-50 sm:text-5xl">
          Notícias
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-papel-100/90">
          Editais, resultados, eventos e o que mais movimenta a cultura de Irecê.
        </p>

        {ultimaPublicacao && (
          <p className="mt-8 border-t border-papel-100/20 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
            Última publicação em{' '}
            <span className="text-accent-300">{ultimaPublicacao}</span>
            <span className="px-2 text-papel-200/40" aria-hidden="true">
              ·
            </span>
            {total} no arquivo
          </p>
        )}
      </div>

      <div className="serrilha absolute inset-x-0 bottom-0 text-papel-100" aria-hidden="true" />
    </section>
  )
}
