import Link from 'next/link'
import type { ReactNode } from 'react'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'

interface AberturaConteudoProps {
  /** Seção de onde se veio, para a trilha (ex.: Exposições). */
  secao: { href: string; rotulo: string }
  titulo: string
  subtitulo?: string | null
  imagem: string | null
  /** Retrato (pessoa) usa recorte vertical ao lado do texto; exposição usa capa larga. */
  retrato?: boolean
  /** Dados curtos sob o título: período, local, datas. */
  children?: ReactNode
}

/** Cabeçalho das páginas de uma exposição ou de uma pessoa. */
export function AberturaConteudo({ secao, titulo, subtitulo, imagem, retrato, children }: AberturaConteudoProps) {
  return (
    <header className="bg-tinta-950 text-papel-50">
      <div
        className={`mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${
          imagem ? (retrato ? 'sm:grid-cols-[minmax(0,1fr)_16rem] lg:grid-cols-[minmax(0,1fr)_22rem]' : 'lg:grid-cols-2 lg:items-end') : ''
        }`}
      >
        <div className={retrato ? 'sm:order-1 sm:self-end' : ''}>
          <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-papel-200">
            <Link href="/memorial" className="underline-offset-4 hover:text-accent-300 hover:underline">
              Memorial
            </Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link href={secao.href} className="underline-offset-4 hover:text-accent-300 hover:underline">
              {secao.rotulo}
            </Link>
          </nav>
          <h1 className="titulo text-4xl leading-[0.95] sm:text-6xl">{titulo}</h1>
          {subtitulo && <p className="mt-4 max-w-xl text-lg leading-relaxed text-papel-100">{subtitulo}</p>}
          {children && <div className="mt-6 text-sm text-papel-200">{children}</div>}
        </div>
        {imagem && (
          <div className={`relative overflow-hidden bg-papel-50/10 ${retrato ? 'aspect-[3/4] sm:order-2' : 'aspect-[4/3]'}`}>
            <ImagemMemorial src={imagem} alt="" sizes={retrato ? '(min-width: 640px) 22rem, 100vw' : '(min-width: 1024px) 50vw, 100vw'} prioridade />
          </div>
        )}
      </div>
    </header>
  )
}
