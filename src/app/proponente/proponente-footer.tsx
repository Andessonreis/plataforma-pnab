import Link from 'next/link'

const linksRodape = [
  { href: '/contato', label: 'Contato' },
  { href: '/faq', label: 'Dúvidas' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Privacidade' },
]

/**
 * Rodapé mínimo da área logada — o rodapé institucional completo
 * (newsletter, navegação pública, selos) é redundante aqui: a sidebar já
 * cobre a navegação e o usuário já converteu. Manter só copyright + links
 * de suporte/legal evita ~1000px de scroll morto no mobile em toda página
 * do proponente.
 */
export function ProponenteFooter() {
  const anoAtual = new Date().getFullYear()

  return (
    <footer className="border-t border-tinta-950/10 px-4 py-5 lg:px-6" role="contentinfo">
      <div className="flex flex-col items-center gap-3 text-xs text-tinta-950/50 sm:flex-row sm:justify-between">
        <p>&copy; {anoAtual} Secretaria de Cultura e Turismo — Irecê/BA</p>
        <nav aria-label="Links de suporte" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {linksRodape.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center hover:text-tinta-950/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
