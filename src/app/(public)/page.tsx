import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA.',
}

// Ícones inline para evitar dependência externa
function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <Badge variant="warning" className="mb-6 text-sm">
              Editais PNAB 2026
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Portal da Política Nacional
              <br />
              Aldir Blanc — Irecê
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-100 leading-relaxed max-w-2xl">
              Acesse editais, inscreva seus projetos culturais, acompanhe resultados
              e consulte informações sobre o fomento à cultura no município de Irecê/BA.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/editais"
                className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-6 py-3.5 text-base font-semibold text-white hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/25 min-h-[44px]"
              >
                Ver Editais Abertos
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors min-h-[44px]"
              >
                Cadastrar-se como Proponente
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Como funciona
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              O processo de inscrição nos editais PNAB Irecê é simples e 100% online.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: IconSearch,
                title: 'Consulte os editais',
                description: 'Acesse os editais abertos, leia o regulamento e baixe os anexos.',
              },
              {
                step: '02',
                icon: IconClipboard,
                title: 'Cadastre-se',
                description: 'Crie sua conta como Pessoa Física, Jurídica ou Coletivo Cultural.',
              },
              {
                step: '03',
                icon: IconFileText,
                title: 'Inscreva seu projeto',
                description: 'Preencha o formulário, anexe documentos e envie sua proposta.',
              },
              {
                step: '04',
                icon: IconCheck,
                title: 'Acompanhe o resultado',
                description: 'Receba notificações sobre habilitação, avaliação e resultado final.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  Passo {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editais em destaque — placeholder para dados reais */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Editais em destaque
              </h2>
              <p className="mt-2 text-slate-600">
                Confira os editais abertos e não perca os prazos.
              </p>
            </div>
            <Link
              href="/editais"
              className="hidden sm:inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Ver todos
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Placeholder — substituir por dados do banco */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Edital de Audiovisual 2026',
                category: 'Audiovisual',
                status: 'Aberto',
                deadline: 'Até 30/04/2026',
                value: 'R$ 150.000,00',
              },
              {
                title: 'Edital de Artes Cênicas 2026',
                category: 'Teatro / Dança',
                status: 'Aberto',
                deadline: 'Até 15/05/2026',
                value: 'R$ 200.000,00',
              },
              {
                title: 'Edital de Patrimônio Cultural 2026',
                category: 'Patrimônio',
                status: 'Em breve',
                deadline: 'Abertura: 01/04/2026',
                value: 'R$ 120.000,00',
              },
            ].map((edital) => (
              <div
                key={edital.title}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {edital.category}
                  </span>
                  <Badge variant={edital.status === 'Aberto' ? 'success' : 'warning'}>
                    {edital.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {edital.title}
                </h3>
                <div className="mt-auto pt-4 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
                    </svg>
                    {edital.deadline}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {edital.value}
                  </p>
                </div>
                <Link
                  href="/editais"
                  className="mt-4 inline-flex items-center justify-center w-full rounded-lg border-2 border-brand-600 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
                >
                  Ver detalhes
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/editais"
              className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todos os editais
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Transparência + Atendimento */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Transparência */}
            <div className="bg-brand-50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                Transparência
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Consulte os projetos culturais apoiados pela PNAB em Irecê.
                Resultados, valores e contrapartidas disponíveis para toda a comunidade.
              </p>
              <Link
                href="/projetos-apoiados"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors min-h-[44px]"
              >
                Ver projetos apoiados
              </Link>
            </div>

            {/* Atendimento */}
            <div className="bg-accent-50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                Atendimento
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Tem dúvidas sobre editais ou inscrições? Envie sua mensagem
                e receba um número de protocolo para acompanhamento.
              </p>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-700 transition-colors min-h-[44px]"
              >
                Entrar em contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
