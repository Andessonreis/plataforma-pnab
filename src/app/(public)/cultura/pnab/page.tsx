import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PNAB — Política Nacional Aldir Blanc',
  description:
    'A Política Nacional Aldir Blanc de Fomento à Cultura (PNAB) é executada em Irecê pela Secretaria de Cultura e Turismo. Conheça os editais, o programa Cultura Viva e os projetos apoiados.',
}

export default function PnabPage() {
  return (
    <main className="bg-white">
      {/* Hero institucional */}
      <section className="bg-gradient-to-b from-brand-50 to-white border-b border-slate-200/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700 mb-3">
            Secretaria de Cultura e Turismo de Irecê
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Política Nacional Aldir Blanc (PNAB)
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl">
            A PNAB é uma política pública federal de fomento permanente à cultura, instituída
            pela Lei nº 14.903/2024. Em Irecê, sua execução é coordenada pela Secretaria de
            Cultura e Turismo, em parceria com o Conselho Municipal de Cultura.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-900">O que é a PNAB?</h2>
            <p className="text-slate-700">
              A Política Nacional Aldir Blanc de Fomento à Cultura (PNAB) dá continuidade e
              amplia o legado da Lei Aldir Blanc emergencial de 2020, agora com caráter
              permanente. Garante repasse anual de recursos da União aos entes federados
              para financiar ações culturais locais, respeitando a diversidade e a autonomia
              dos territórios.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10">Como Irecê executa a PNAB</h2>
            <p className="text-slate-700">
              A Secretaria de Cultura e Turismo de Irecê é a responsável pela gestão local
              dos recursos. A execução ocorre por meio de chamamentos públicos (editais) com
              critérios objetivos de habilitação, avaliação e transparência, acompanhados
              pelo Conselho Municipal de Cultura.
            </p>
          </div>

          {/* Programas ativos */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <article className="rounded-2xl border border-brand-200 bg-brand-50/40 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Ativo
                </span>
                <span className="text-xs font-medium text-slate-600">Chamamento público</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Cultura Viva</h3>
              <p className="mt-2 text-sm text-slate-700">
                Chamamento público da Rede Municipal de Pontos de Cultura de Irecê.
                Reconhecimento e fomento a iniciativas culturais de base comunitária.
              </p>
              <Link
                href="/editais"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ver edital
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  Em breve
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Novos editais</h3>
              <p className="mt-2 text-sm text-slate-700">
                Novos chamamentos serão publicados ao longo do ano conforme o plano anual da
                PNAB aprovado pelo Conselho Municipal de Cultura.
              </p>
              <Link
                href="/noticias"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand-700"
              >
                Acompanhar pelas notícias
              </Link>
            </article>
          </div>

          {/* Transparência */}
          <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900">Transparência</h3>
            <p className="mt-2 text-sm text-slate-700">
              Todos os projetos contemplados, valores e cronogramas são públicos e podem ser
              consultados nas seções abaixo.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/projetos-apoiados"
                className="inline-flex items-center rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                Projetos apoiados
              </Link>
              <Link
                href="/editais"
                className="inline-flex items-center rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                Editais publicados
              </Link>
              <Link
                href="/manuais"
                className="inline-flex items-center rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors"
              >
                Manuais e documentos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
