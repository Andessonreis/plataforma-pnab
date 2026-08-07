import type { ReactNode } from 'react'
import { agruparBlocos, extractHeadings } from './markdown-blocos'

export { stripMarkdown, extractHeadings, type NoticiaHeading } from './markdown-blocos'

// ── Ênfase e link inline ────────────────────────────────────────────────────

const RE_INLINE = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`|\[(.+?)\]\((.+?)\))/

function renderInline(texto: string, keyPrefix: string): ReactNode[] {
  const partes: ReactNode[] = []
  let resto = texto
  let indice = 0

  while (resto.length > 0) {
    const match = RE_INLINE.exec(resto)
    if (!match) {
      partes.push(resto)
      break
    }

    if (match.index > 0) partes.push(resto.slice(0, match.index))
    const key = `${keyPrefix}-${indice++}`

    if (match[2] !== undefined) {
      partes.push(<strong key={key}>{match[2]}</strong>)
    } else if (match[3] !== undefined) {
      partes.push(<em key={key}>{match[3]}</em>)
    } else if (match[4] !== undefined) {
      partes.push(<em key={key}>{match[4]}</em>)
    } else if (match[5] !== undefined) {
      partes.push(
        <code key={key} className="rounded bg-tinta-900/10 px-1.5 py-0.5 text-[0.9em]">
          {match[5]}
        </code>,
      )
    } else if (match[6] !== undefined && match[7] !== undefined) {
      const externo = /^https?:\/\//.test(match[7])
      partes.push(
        <a
          key={key}
          href={match[7]}
          className="text-brand-700 underline underline-offset-4 hover:text-brand-800"
          target={externo ? '_blank' : undefined}
          rel={externo ? 'noopener noreferrer' : undefined}
        >
          {match[6]}
        </a>,
      )
    }

    resto = resto.slice(match.index + match[0].length)
  }

  return partes
}

// ── Render ───────────────────────────────────────────────────────────────────

/**
 * Corpo do artigo em Markdown → JSX. Agrupa listas consecutivas num único
 * `<ul>`/`<ol>` pai (o parser anterior gerava `<li>` órfão) e ancora
 * `##`/`###` com o mesmo `id` de `extractHeadings`, na mesma ordem.
 */
export function renderMarkdown(corpo: string): ReactNode {
  const blocos = agruparBlocos(corpo)
  const headings = extractHeadings(corpo)
  let indiceHeading = 0

  return (
    <>
      {blocos.map((bloco, i) => {
        const key = `bloco-${i}`

        switch (bloco.tipo) {
          case 'heading': {
            const heading = headings[indiceHeading++]
            const Tag = bloco.nivel === 2 ? 'h2' : 'h3'
            return (
              <Tag
                key={key}
                id={heading?.id}
                className={
                  bloco.nivel === 2
                    ? 'titulo mt-10 scroll-mt-32 text-2xl leading-tight tracking-wide text-tinta-900 first:mt-0'
                    : 'titulo mt-8 scroll-mt-32 text-xl leading-tight tracking-wide text-tinta-900'
                }
              >
                {renderInline(bloco.texto, key)}
              </Tag>
            )
          }

          case 'lista': {
            const ListaTag = bloco.ordenada ? 'ol' : 'ul'
            return (
              <ListaTag
                key={key}
                className={`mt-4 space-y-2 pl-6 text-base leading-relaxed text-tinta-700 ${
                  bloco.ordenada ? 'list-decimal' : 'list-disc'
                }`}
              >
                {bloco.itens.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ListaTag>
            )
          }

          case 'citacao':
            return (
              <blockquote
                key={key}
                className="mt-6 border-l-4 border-brand-700 pl-5 text-base italic leading-relaxed text-tinta-600"
              >
                {bloco.linhas.map((linha, j) => (
                  <p key={`${key}-${j}`} className={j > 0 ? 'mt-2' : undefined}>
                    {renderInline(linha, `${key}-${j}`)}
                  </p>
                ))}
              </blockquote>
            )

          case 'paragrafo':
          default:
            return (
              <p key={key} className="mt-4 text-base leading-relaxed text-tinta-700 first:mt-0">
                {renderInline(bloco.texto, key)}
              </p>
            )
        }
      })}
    </>
  )
}
