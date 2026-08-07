import type { NoticiaHeading } from '@/lib/utils/markdown'

interface SumarioNoticiaProps {
  headings: NoticiaHeading[]
}

/**
 * Sumário do artigo, condicional a corpo com estrutura real (3+ headings).
 *
 * A maioria das notícias tem 2-4 parágrafos e não precisa de índice; a que
 * tem estrutura longa ganha apoio de navegação, mesma razão de existir de
 * `SumarioEdital` — reaproveita a régua horizontal dele, sem os campos que só
 * edital tem (versão acessível, link de resultado).
 */
export function SumarioNoticia({ headings }: SumarioNoticiaProps) {
  if (headings.length < 3) return null

  return (
    <nav
      id="sumario-noticia"
      aria-label="Seções desta notícia"
      className="border-b-2 border-tinta-900 bg-papel-100"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap px-3 text-xs font-bold uppercase tracking-[0.14em] text-tinta-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-500"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
