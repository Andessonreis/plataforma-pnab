import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Turismo em Irecê',
  description:
    'Informações sobre turismo em Irecê/BA — em breve, conteúdo institucional da Secretaria de Cultura e Turismo.',
}

export default function TurismoPage() {
  return (
    <main className="bg-white">
      <section className="bg-gradient-to-b from-accent-50 to-white border-b border-slate-200/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-700 mb-3">
            Secretaria de Cultura e Turismo de Irecê
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Turismo em Irecê
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl">
            Estamos preparando o conteúdo institucional desta seção. Em breve você encontrará
            aqui informações sobre pontos turísticos, eventos, roteiros e serviços da cidade.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100">
              <svg className="h-8 w-8 text-accent-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Em preparação</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Tem uma dúvida, sugestão ou evento turístico para divulgar? Entre em contato com a
              Secretaria.
            </p>
            <div className="mt-6">
              <Link
                href="/contato"
                className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Fale com a Secretaria
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
