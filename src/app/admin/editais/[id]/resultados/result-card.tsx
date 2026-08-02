import Link from 'next/link'
import type { ReactNode } from 'react'

interface ResultCardProps {
  posicao: ReactNode
  empatado?: boolean
  proponenteNome: string
  numero: string
  /** Omitir (undefined/null) esconde a linha de categoria — ex.: quando a tabela já está agrupada por categoria. */
  categoria?: string | null
  avaliacoes: ReactNode
  nota: ReactNode
  status?: ReactNode
  detailsHref: string
  /** Inscrição ainda sem avaliação finalizada — reduz ênfase visual do card. */
  muted?: boolean
}

/**
 * Card de resultado para telas pequenas (< lg). Reaproveitado pela prévia de ranking
 * e pela tabela oficial pós-publicação — ambas mostram as mesmas 7 colunas da versão
 * desktop (posição, proponente, categoria, avaliações, nota, status/faixa, ações).
 */
export function ResultCard({
  posicao,
  empatado,
  proponenteNome,
  numero,
  categoria,
  avaliacoes,
  nota,
  status,
  detailsHref,
  muted,
}: ResultCardProps) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 leading-snug">{proponenteNome}</p>
          <p className="text-xs text-slate-400 mt-0.5">{numero}</p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 text-sm font-medium text-slate-900">
          {posicao}
          {empatado && (
            <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Empate
            </span>
          )}
        </span>
      </div>

      {categoria != null && <p className="text-xs text-slate-500 mb-2">{categoria}</p>}

      <div className="flex items-center justify-between gap-2 text-sm mb-2.5">
        <div className="text-slate-600">{avaliacoes}</div>
        <div className="font-semibold text-slate-900 tabular-nums shrink-0">{nota}</div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {status ?? <span />}
        <Link
          href={detailsHref}
          className="ml-auto text-sm font-medium text-brand-600 hover:text-brand-700 min-h-[44px] inline-flex items-center"
        >
          Detalhes
        </Link>
      </div>
    </div>
  )
}
