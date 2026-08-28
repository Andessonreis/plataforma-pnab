'use client'

import type { MarcoEditavel } from '@/lib/utils/retificacao'
import { formatDateTime } from '@/lib/utils/format'

/** Alteração pendente de um marco, antes de virar retificação gravada. */
export interface AlteracaoPendente {
  dataHora: string
  fimEm?: string
}

interface Props {
  marcos: MarcoEditavel[]
  alteracoes: Record<number, AlteracaoPendente>
  onAlterar: (indice: number, valor: AlteracaoPendente | null) => void
  desabilitado?: boolean
}

/** `datetime-local` só aceita "AAAA-MM-DDTHH:mm" — o banco guarda com segundos. */
function paraInput(valor: string | undefined): string {
  return valor ? valor.slice(0, 16) : ''
}

/**
 * A lista de marcos do cronograma com o que a retificação muda em cada um.
 *
 * Só a data nova é digitada. A data antiga não é campo: ela é lida do próprio
 * cronograma na hora de salvar, porque é ela que vai aparecer riscada na
 * página pública — e uma data riscada errada é pior do que nenhuma, já que
 * afirma ao cidadão que o edital dizia algo que nunca disse.
 */
export function RetificacaoMarcos({ marcos, alteracoes, onAlterar, desabilitado }: Props) {
  return (
    <fieldset className="space-y-2" disabled={desabilitado}>
      <legend className="text-xs font-semibold text-slate-700">
        Datas alteradas por esta retificação
      </legend>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {marcos.map((marco) => {
          const pendente = alteracoes[marco.indice]
          const marcado = pendente !== undefined
          const inputId = `marco-${marco.indice}`

          return (
            <li key={marco.indice} className="px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <input
                  type="checkbox"
                  id={inputId}
                  checked={marcado}
                  onChange={(e) =>
                    onAlterar(
                      marco.indice,
                      e.target.checked
                        ? { dataHora: marco.dataHora, ...(marco.fimEm ? { fimEm: marco.fimEm } : {}) }
                        : null,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor={inputId} className="min-w-0 flex-1 text-sm text-slate-800">
                  {marco.label}
                  <span className="ml-2 tabular-nums text-xs text-slate-500">
                    {formatDateTime(marco.dataHora)}
                    {marco.fimEm && ` até ${formatDateTime(marco.fimEm)}`}
                  </span>
                  {marco.retificadoPor && (
                    <span className="ml-2 text-xs font-semibold text-red-700">
                      já retificado (nº {marco.retificadoPor})
                    </span>
                  )}
                </label>
              </div>

              {marcado && (
                <div className="mt-2 flex flex-wrap gap-2 pl-7">
                  <label className="text-xs text-slate-600">
                    Nova data
                    <input
                      type="datetime-local"
                      value={paraInput(pendente.dataHora)}
                      onChange={(e) =>
                        onAlterar(marco.indice, { ...pendente, dataHora: `${e.target.value}:00` })
                      }
                      className="mt-0.5 block rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </label>

                  {marco.fimEm && (
                    <label className="text-xs text-slate-600">
                      Novo fim do período
                      <input
                        type="datetime-local"
                        value={paraInput(pendente.fimEm)}
                        onChange={(e) =>
                          onAlterar(marco.indice, { ...pendente, fimEm: `${e.target.value}:00` })
                        }
                        className="mt-0.5 block rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </label>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
