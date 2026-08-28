import Link from 'next/link'
import type { LinkRodape } from './links'

interface ColunaLinksProps {
  titulo: string
  links: LinkRodape[]
  className?: string
}

/**
 * Uma lista de links do rodapé.
 *
 * O título era caixa-alta de 11px com tracking largo, e os links, 14px — a
 * diferença entre rótulo e item ficava só na cor, o que num rodapé de portal
 * público é pouco: boa parte de quem procura "Manuais" aqui está lendo em
 * telefone, com pressa ou com vista cansada. O título passa a ser o item mais
 * pesado do bloco e os links crescem para 15px.
 */
export function ColunaLinks({ titulo, links, className = '' }: ColunaLinksProps) {
  return (
    <div className={className}>
      <h2 className="mb-3 text-base font-semibold leading-none text-papel-50">{titulo}</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-block py-0.5 text-[0.9375rem] leading-snug text-papel-200/80 transition-colors hover:text-papel-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
