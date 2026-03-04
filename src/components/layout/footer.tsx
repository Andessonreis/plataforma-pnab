import Image from 'next/image'
import Link from 'next/link'
import { NewsletterForm } from './newsletter-form'

const navigationLinks = [
  { href: '/', label: 'Início' },
  { href: '/editais', label: 'Editais' },
  { href: '/projetos-apoiados', label: 'Projetos Apoiados' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/manuais', label: 'Manuais' },
  { href: '/faq', label: 'Perguntas Frequentes' },
  { href: '/contato', label: 'Contato' },
]

const proponenteLinks = [
  { href: '/login', label: 'Acessar minha conta' },
  { href: '/cadastro', label: 'Cadastrar-se' },
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
      {/* Faixa accent no topo */}
      <div className="h-1 bg-gradient-to-r from-brand-600 via-accent-500 to-brand-600" />

      {/* Newsletter */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shrink-0">
              <h2 className="text-sm font-semibold text-white">
                Receba novidades sobre editais
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Novos editais, prazos e resultados no seu e-mail.
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Coluna 1 — Institucional */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                <Image
                  src="https://www.irece.ba.gov.br/files/config/brasao.png"
                  alt="Brasão de Irecê"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight group-hover:text-brand-200 transition-colors">
                  Portal PNAB
                </p>
                <p className="text-xs text-slate-400 leading-tight">Irecê/BA</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-slate-400">
              Política Nacional Aldir Blanc de Fomento à Cultura.
              Secretaria de Arte e Cultura de Irecê/BA.
            </p>
            {/* Contato */}
            <div className="space-y-2.5 text-sm">
              <a
                href="mailto:cultura@irece.ba.gov.br"
                className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                cultura@irece.ba.gov.br
              </a>
              <a
                href="tel:+557436413116"
                className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </span>
                (74) 3641-3116
              </a>
              <p className="flex items-center gap-2.5 text-slate-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </span>
                Irecê, Bahia — Brasil
              </p>
            </div>
          </div>

          {/* Coluna 2 — Navegação */}
          <div className="lg:col-span-3">
            <h2 className="text-[11px] font-semibold text-white uppercase tracking-widest mb-4">
              Navegação
            </h2>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white hover:pl-1 transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Área do Proponente + Legal */}
          <div className="lg:col-span-3">
            <h2 className="text-[11px] font-semibold text-white uppercase tracking-widest mb-4">
              Área do Proponente
            </h2>
            <ul className="space-y-2">
              {proponenteLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white hover:pl-1 transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="text-[11px] font-semibold text-white uppercase tracking-widest mb-4 mt-8">
              Legal
            </h2>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white hover:pl-1 transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4 — Selos e Badges */}
          <div className="lg:col-span-2">
            <h2 className="text-[11px] font-semibold text-white uppercase tracking-widest mb-4">
              Certificações
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-3 group hover:bg-white/[0.06] transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500/10 shrink-0">
                  <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-200">PNAB</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lei Aldir Blanc</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-3 group hover:bg-white/[0.06] transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 shrink-0">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-200">WCAG AA</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Acessibilidade</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-3 group hover:bg-white/[0.06] transition-colors">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-500/10 shrink-0">
                  <svg className="h-4 w-4 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-200">100% Digital</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Processos online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              &copy; {currentYear} Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA
            </p>
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              Portal PNAB Irecê
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
