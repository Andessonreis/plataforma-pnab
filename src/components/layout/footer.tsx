import Link from 'next/link'
import { NewsletterForm } from './newsletter-form'

const institutionalLinks = [
  { href: '/', label: 'Início' },
  { href: '/editais', label: 'Editais' },
  { href: '/projetos-apoiados', label: 'Projetos Apoiados' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/manuais', label: 'Manuais' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contato', label: 'Contato' },
]

const legalLinks = [
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Política de Privacidade' },
  { href: '/acessibilidade', label: 'Acessibilidade' },
]

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-950 text-slate-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1 — Sobre */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Portal PNAB</p>
                <p className="text-xs text-slate-400 leading-tight">Irecê</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Política Nacional Aldir Blanc de Fomento à Cultura.
              Secretaria de Arte e Cultura de Irecê/BA.
            </p>
          </div>

          {/* Coluna 2 — Navegação */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Navegação</h2>
            <ul className="space-y-2.5">
              {institutionalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Área do Proponente */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Área do Proponente</h2>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login" className="text-sm hover:text-white transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="text-sm hover:text-white transition-colors">
                  Cadastrar-se
                </Link>
              </li>
            </ul>

            <h2 className="text-sm font-semibold text-white mb-4 mt-8">Contato</h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:cultura@irece.ba.gov.br" className="hover:text-white transition-colors">
                  cultura@irece.ba.gov.br
                </a>
              </li>
              <li>
                <a href="tel:+557436413116" className="hover:text-white transition-colors">
                  (74) 3641-3116
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4 — Legal */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Legal</h2>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-slate-700/50 py-8">
          <div className="max-w-xl">
            <h2 className="text-sm font-semibold text-white mb-2">Receba novidades</h2>
            <p className="text-sm text-slate-400 mb-4">
              Inscreva-se para receber informações sobre editais, prazos e resultados.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-slate-700/50 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {currentYear} Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA</p>
            <p>Portal PNAB Irecê — Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
