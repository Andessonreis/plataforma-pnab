export interface LinkRodape {
  href: string
  label: string
}

export const linksNavegacao: LinkRodape[] = [
  { href: '/', label: 'Início' },
  { href: '/editais', label: 'Editais' },
  { href: '/projetos-apoiados', label: 'Projetos Apoiados' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/manuais', label: 'Manuais' },
  { href: '/faq', label: 'Perguntas Frequentes' },
  { href: '/contato', label: 'Contato' },
]

export const linksProponente: LinkRodape[] = [
  { href: '/login', label: 'Acessar minha conta' },
  { href: '/cadastro', label: 'Cadastrar-se' },
]

export const linksLegais: LinkRodape[] = [
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Política de Privacidade' },
  { href: '/acessibilidade', label: 'Acessibilidade' },
]
