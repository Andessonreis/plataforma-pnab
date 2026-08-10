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

function Trilha({ titulo }: { titulo: string }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-4 text-xs tracking-wide text-papel-200/80">
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
  )
}

/**
 * Cabeçalho do artigo — manchete de jornal: a foto é o fundo da faixa
 * inteira (sangra as bordas da tela), o título vem impresso por cima, na
 * base dela, como capa de site de notícia. Sem foto, cai pro campo de cor
 * chapada de antes — a maioria das notícias curtas nem precisa de manchete.
 *
 * O véu (tinta + gradiente) segue o mesmo tratamento de `FundoFotos`, pra
 * ler como a mesma peça do resto do site em vez de inventar um estilo novo
 * só pra essa página.
 */
export function CabecalhoNoticia({
  titulo,
  tags,
  dataPorExtenso,
  publicadoEmIso,
  tempoLeitura,
  imagemUrl,
}: CabecalhoNoticiaProps) {
  const meta = (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-5 text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80 sm:px-6 lg:px-8">
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
  )

  if (!imagemUrl) {
    return (
      <header id="cabecalho-noticia" className="bg-tinta-950 text-papel-100">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <Trilha titulo={titulo} />
          <p className="rotulo text-xs text-accent-300">Notícia</p>
          <h1 className="mt-1 titulo text-2xl leading-tight tracking-wide text-papel-50 sm:text-4xl lg:text-5xl">
            {titulo}
          </h1>
        </div>
        <div className="mt-6 border-t border-papel-100/20">{meta}</div>
      </header>
    )
  }

  return (
    <header id="cabecalho-noticia" className="bg-tinta-950 text-papel-100">
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagemUrl} alt="" loading="eager" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-brand-600/30 mix-blend-multiply" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-tinta-950/95 via-tinta-950/45 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8">
            <Trilha titulo={titulo} />
            <p className="rotulo text-xs text-accent-300">Notícia</p>
            <h1 className="mt-1 titulo text-2xl leading-tight tracking-wide text-papel-50 sm:text-4xl lg:text-5xl">
              {titulo}
            </h1>
          </div>
        </div>
      </div>
      <div className="border-b border-papel-100/20">{meta}</div>
    </header>
  )
}
