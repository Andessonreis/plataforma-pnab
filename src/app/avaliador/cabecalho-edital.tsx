import Link from 'next/link'
import type { ReactNode } from 'react'
import { FadeIn, IconArrowLeft } from '@/components/ui'
import { getRoleTheme } from '@/app/admin/role-theme'

const theme = getRoleTheme('AVALIADOR')

interface Props {
  /** Ícone da frente de trabalho, já dimensionado pelo caller. */
  icone: ReactNode
  titulo: string
  ano: number
  /** Fase ativa pra esta tela — muda o realce da faixa de situação. */
  ativo: boolean
  /** Texto da faixa de situação, escrito da perspectiva do avaliador. */
  situacao: string
  /** Volta pra seleção de edital; omitido quando o avaliador só tem um edital. */
  voltarHref?: string
}

/**
 * Cabeçalho das telas escopadas num edital (fila de avaliação e recursos).
 *
 * As duas telas repetiam o mesmo bloco — voltar, título do edital, edição e
 * situação da fase — e o edital é o contexto que não pode se perder de vista:
 * cada um tem sua própria régua de pontuação.
 */
export function CabecalhoEdital({ icone, titulo, ano, ativo, situacao, voltarHref }: Props) {
  return (
    <FadeIn>
      <header className="mb-5 sm:mb-7">
        {voltarHref && (
          <Link
            href={voltarHref}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
          >
            <IconArrowLeft className="h-4 w-4" />
            Trocar edital
          </Link>
        )}

        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0 ring-1 ring-inset ${theme.chipBg} ${theme.chipText} ${theme.chipRing}`}>
            {icone}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{titulo}</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Edição {ano}</p>
          </div>
        </div>

        {ativo ? (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            {situacao}
          </p>
        ) : (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            {situacao}
          </p>
        )}
      </header>
    </FadeIn>
  )
}
