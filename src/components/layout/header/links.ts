export interface SecaoNav {
  href: string
  label: string
}

/**
 * Seções do portal, na ordem em que aparecem na régua.
 *
 * A ordem é editorial e não alfabética: primeiro o que a pessoa vem buscar
 * (editais), depois o que comprova resultado (projetos apoiados), depois o
 * acompanhamento e o suporte.
 */
export const SECOES: SecaoNav[] = [
  { href: '/', label: 'Início' },
  { href: '/editais', label: 'Editais' },
  { href: '/projetos-apoiados', label: 'Projetos apoiados' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/faq', label: 'Dúvidas' },
  { href: '/contato', label: 'Contato' },
]

/** Uma seção está ativa na própria rota e nas rotas filhas, menos a raiz. */
export function secaoAtiva(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
