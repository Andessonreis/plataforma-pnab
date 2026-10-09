import Link from 'next/link'
import type { Institucional } from '@/lib/memorial/config'
import { ImagemMemorial } from './imagem-memorial'

interface CapaMemorialProps {
  institucional: Institucional
  foto: string | null
  credito: string | null
  /** Versão baixa, para a pré-visualização do painel. */
  previa?: boolean
}

/**
 * Abertura da página do Memorial: uma fotografia do acervo ocupando a tela, o nome e a
 * chamada editáveis pela equipe e os dois caminhos principais. Sem foto publicada,
 * a capa fica tipográfica em vez de usar imagem de outra origem.
 */
export function CapaMemorial({ institucional, foto, credito, previa }: CapaMemorialProps) {
  // Na pré-visualização a capa fica dentro de uma página do painel, que já tem seu h1
  const TituloCapa = previa ? 'p' : 'h1'
  return (
    <section className="relative isolate overflow-hidden bg-tinta-950 text-papel-50">
      {foto && (
        <>
          <ImagemMemorial src={foto} alt="" sizes="100vw" prioridade className="-z-20 sepia-[.35]" />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-tinta-950 via-tinta-950/70 to-tinta-950/20 sm:bg-gradient-to-r sm:from-tinta-950/95 sm:via-tinta-950/60 sm:to-transparent"
            aria-hidden="true"
          />
        </>
      )}

      <div
        className={`mx-auto flex max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-16 lg:px-8 ${
          previa ? 'min-h-[22rem] pt-12' : 'min-h-[78svh] pt-24 sm:min-h-[70vh]'
        }`}
      >
        <TituloCapa
          className={`titulo max-w-3xl leading-[0.95] ${previa ? 'text-4xl sm:text-5xl' : 'text-[2.75rem] sm:text-7xl lg:text-8xl'}`}
        >{institucional.titulo}</TituloCapa>
        {institucional.chamada && (
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-papel-100 sm:text-xl">{institucional.chamada}</p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/memorial/agendar"
            className="inline-flex min-h-[48px] items-center justify-center bg-accent-500 px-6 text-sm font-bold text-tinta-950 hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-50"
          >
            Agende sua visita
          </Link>
          <Link
            href="/memorial/sobre"
            className="inline-flex min-h-[48px] items-center justify-center border border-papel-100/60 px-6 text-sm font-semibold text-papel-50 hover:bg-papel-50/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-50"
          >
            Conheça o Memorial
          </Link>
        </div>

        {foto && credito && <p className="mt-10 text-xs text-papel-200/80 sm:self-end">Foto: {credito}</p>}
      </div>
    </section>
  )
}
