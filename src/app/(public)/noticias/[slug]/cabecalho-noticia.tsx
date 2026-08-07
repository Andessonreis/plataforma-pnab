import Link from 'next/link'
import { IconCalendar, IconClock } from '@/components/ui/icons'

interface CabecalhoNoticiaProps {
  titulo: string
  tags: string[]
  dataPorExtenso: string
  publicadoEmIso: string
  tempoLeitura: number
  imagemUrl: string | null
}

/**
 * Cabeçalho do artigo, em campo de cor sólido.
 *
 * Não é `FolhaDeRosto`: o rodízio de fotos dela (`FundoFotos`) foi pensado
 * para página-índice de uma seção inteira, não para um único artigo — usá-la
 * aqui seria over-engineering para um H1. As tags também deixam de ser pílula
 * branca sobre gradiente e viram texto plano, igual ao que `Manchete` e
 * `EntradaNoticia` já usam na listagem.
 */
export function CabecalhoNoticia({
  titulo,
  tags,
  dataPorExtenso,
  publicadoEmIso,
  tempoLeitura,
  imagemUrl,
}: CabecalhoNoticiaProps) {
  return (
    <header id="cabecalho-noticia" className="bg-tinta-950 text-papel-100">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <nav aria-label="Trilha de navegação" className="mb-8 text-xs tracking-wide text-papel-200/80">
          <Link href="/" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Início
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <Link href="/noticias" className="underline-offset-4 hover:text-accent-300 hover:underline">
            Notícias
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span className="text-papel-50">{titulo}</span>
        </nav>

        <p className="rotulo text-xs text-accent-300">Notícia</p>
        <h1 className="mt-1 titulo text-2xl leading-tight tracking-wide text-papel-50 sm:text-4xl lg:text-5xl">
          {titulo}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-papel-100/20 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
          <time dateTime={publicadoEmIso} className="inline-flex items-center gap-1.5">
            <IconCalendar className="h-4 w-4" aria-hidden="true" />
            {dataPorExtenso}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <IconClock className="h-4 w-4" aria-hidden="true" />
            {tempoLeitura} min de leitura
          </span>
          {tags.length > 0 && (
            <span aria-label={`Categorias: ${tags.join(', ')}`}>{tags.join(' · ')}</span>
          )}
        </div>

        {imagemUrl && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-sm bg-papel-100/5">
            {/* `img` cru, e não `next/image`: a URL vem do Storage e varia por
                registro, então não há ganho de otimização previsível aqui. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagemUrl} alt={titulo} loading="eager" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </header>
  )
}
