import Link from 'next/link'
import { FadeIn, IconArrowLeft, IconShield } from '@/components/ui'

interface Props {
  titulo: string
  ano: number
  /** Edital ainda na fase de habilitação: muda o realce da faixa de situação. */
  ativo: boolean
}

/** Cabeçalho institucional da fila de habilitação, escopado no edital escolhido. */
export function CabecalhoHabilitacao({ titulo, ano, ativo }: Props) {
  return (
    <FadeIn>
      <header className="mb-6 sm:mb-8">
        <Link
          href="/admin/habilitacao"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
        >
          <IconArrowLeft className="h-4 w-4" />
          Trocar edital
        </Link>

        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
            <IconShield className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {titulo}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Edição {ano} <span className="text-slate-400">·</span> Conferência e Validação documental
            </p>
          </div>
        </div>

        {/* Status da etapa */}
        {ativo ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <p className="text-sm text-emerald-900">
              <strong className="font-semibold">Fase aberta de conferência</strong> — confira a
              documentação enviada e valide as inscrições para habilitação e análise da comissão.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <svg className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-600">
              A fase de conferência deste edital já foi encerrada. As inscrições abaixo refletem o
              histórico da conferência.
            </p>
          </div>
        )}
      </header>
    </FadeIn>
  )
}
