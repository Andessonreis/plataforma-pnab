import { renderMarkdown } from '@/lib/utils/markdown'

interface CorpoNoticiaProps {
  corpo: string
}

/**
 * Corpo do artigo, com medida de leitura fixa (~65-75 caracteres por linha,
 * mesmo raciocínio de `TextoEdital`) em vez da largura de container inteira.
 */
export function CorpoNoticia({ corpo }: CorpoNoticiaProps) {
  return (
    <section id="corpo-noticia" className="papel-textura bg-papel-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-[42rem]">{renderMarkdown(corpo)}</article>
      </div>
    </section>
  )
}
