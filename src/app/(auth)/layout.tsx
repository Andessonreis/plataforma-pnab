import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen lg:overflow-hidden">
      {/* Painel de branding — lado esquerdo (desktop) / header (mobile) */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[55%] relative flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950">
        {/* Textura sutil de fundo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        {/* Forma decorativa — arco cultural */}
        <div
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.06]"
          aria-hidden="true"
        />
        <div
          className="absolute -right-48 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.04]"
          aria-hidden="true"
        />

        {/* Conteúdo principal do painel */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 xl:px-16 py-16">
          {/* Brasão + identidade */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative h-16 w-16 flex-shrink-0 rounded-xl bg-white/10 backdrop-blur-sm p-2 ring-1 ring-white/20">
                <Image
                  src="https://www.irece.ba.gov.br/files/config/brasao.png"
                  alt="Brasão de Irecê"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Portal PNAB
                </h1>
                <p className="text-brand-200 text-sm font-medium">
                  Irecê — Bahia
                </p>
              </div>
            </div>

            <p className="text-xl xl:text-2xl font-semibold text-white/90 leading-snug max-w-md">
              Política Nacional Aldir Blanc de Fomento à Cultura
            </p>

            <p className="mt-4 text-brand-200/80 text-sm leading-relaxed max-w-sm">
              Plataforma oficial para publicação de editais, inscrição de propostas
              e acompanhamento dos processos culturais do município de Irecê.
            </p>
          </div>

          {/* Badges de credenciais */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-medium text-brand-100 ring-1 ring-white/10">
              <svg className="h-3.5 w-3.5 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              PNAB
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-medium text-brand-100 ring-1 ring-white/10">
              <svg className="h-3.5 w-3.5 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              WCAG AA
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-medium text-brand-100 ring-1 ring-white/10">
              <svg className="h-3.5 w-3.5 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              100% Digital
            </span>
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="relative z-10 px-12 xl:px-16 pb-8">
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-brand-300/70">
              Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA
            </p>
          </div>
        </div>
      </div>

      {/* Header mobile — aparece só em telas pequenas */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-brand-800 to-brand-900 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 flex-shrink-0 rounded-lg bg-white/10 p-1">
            <Image
              src="https://www.irece.ba.gov.br/files/config/brasao.png"
              alt="Brasão de Irecê"
              fill
              className="object-contain p-0.5"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">
              Portal PNAB
            </p>
            <p className="text-[11px] text-brand-200 leading-tight">
              Irecê — Bahia
            </p>
          </div>
        </div>
      </div>

      {/* Painel do formulário — lado direito */}
      <div className="flex-1 flex flex-col bg-white lg:overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-8 pt-20 lg:pt-8">
          <div className="w-full max-w-md mx-auto">
            {children}

            {/* Voltar ao portal */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors font-medium"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Voltar ao portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
