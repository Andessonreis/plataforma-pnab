import Link from 'next/link'
import { FadeIn, IconStar, IconCheck } from '@client/components/ui'

interface AvaliacaoHeaderProps {
  edital: { id: string; titulo: string }
  ativo: boolean
  podeTrocarEdital: boolean
}

export function AvaliacaoHeader({ edital, ativo, podeTrocarEdital }: AvaliacaoHeaderProps) {
  return (
    <FadeIn>
      <header className="mb-6 sm:mb-8">
        {podeTrocarEdital && (
          <Link
            href="/admin/avaliacao"
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Trocar edital
          </Link>
        )}

        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
            <IconStar className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              Avaliação de projetos
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              Acompanhe a distribuição de avaliadores e o andamento das notas em cada inscrição.
            </p>
          </div>
        </div>

        {ativo ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <p className="text-sm text-emerald-900">
              <strong className="font-semibold">Fase de avaliação aberta</strong> em{' '}
              <span className="font-medium">{edital.titulo}</span>.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <svg className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-600">
              A fase de avaliação deste edital não está aberta. As inscrições abaixo refletem o histórico das notas.
            </p>
          </div>
        )}

        {/* Próximo passo — consolidar e publicar o resultado (fluxo já existente) */}
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <IconCheck className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              Concluiu as avaliações?{' '}
              <span className="font-medium text-slate-900">Consolide as notas e publique o resultado.</span>
            </p>
          </div>
          <Link
            href={`/admin/editais/${edital.id}/resultados`}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Consolidar e divulgar resultado
            <span aria-hidden>→</span>
          </Link>
        </div>
      </header>
    </FadeIn>
  )
}
