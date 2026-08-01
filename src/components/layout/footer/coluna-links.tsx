import Link from 'next/link'
import type { LinkRodape } from './links'

interface ColunaLinksProps {
  titulo: string
  links: LinkRodape[]
  className?: string
}

export function ColunaLinks({ titulo, links, className = '' }: ColunaLinksProps) {
  return (
    <div className={className}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-papel-50 sm:mb-4">
        {titulo}
      </h2>
      <ul className="space-y-1.5 sm:space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-papel-200/70 transition-all duration-150 hover:pl-1 hover:text-papel-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
