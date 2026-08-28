'use client'

import { Button } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'
import type { Retificacao } from '@/types/retificacao'

interface Props {
  retificacoes: Retificacao[]
  onDesfazer: (numero: string) => void
  desfazendo: string | null
}

/**
 * Os atos já registrados, com a saída para desfazer cada um.
 *
 * Desfazer existe porque a retificação é transcrita de um Diário Oficial, e
 * data trocada na digitação só costuma aparecer depois de publicada na página.
 * Corrigir à mão deixaria a tela riscando uma data que nunca valeu; desfazer
 * devolve o cronograma exatamente ao estado anterior ao ato.
 */
export function RetificacoesRegistradas({ retificacoes, onDesfazer, desfazendo }: Props) {
  if (retificacoes.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Nenhuma retificação registrada. O edital está valendo como foi publicado.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {retificacoes.map((retificacao) => (
        <li key={retificacao.numero} className="flex flex-wrap items-start gap-3 px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Retificação nº {retificacao.numero}
              <span className="ml-2 font-normal tabular-nums text-slate-500">
                DO de {formatDate(retificacao.publicadoEm)}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-slate-700">{retificacao.resumo}</p>
            {retificacao.diarioOficialUrl && (
              <a
                href={retificacao.diarioOficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-brand-700 underline underline-offset-2"
              >
                Ver no Diário Oficial
              </a>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDesfazer(retificacao.numero)}
            disabled={desfazendo !== null}
          >
            {desfazendo === retificacao.numero ? 'Desfazendo…' : 'Desfazer'}
          </Button>
        </li>
      ))}
    </ul>
  )
}
