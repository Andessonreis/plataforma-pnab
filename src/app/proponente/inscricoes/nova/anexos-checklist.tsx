'use client'

import { Badge } from '@/components/ui'
import { IconCheck } from '@/components/ui/icons'
import type { TipoAnexo } from '@/lib/constants/attachment-types'
import type { Anexo } from '@/types/anexo'

interface AnexosChecklistProps {
  tipos: TipoAnexo[]
  anexos: Anexo[]
}

// Checklist de documentos esperados para a inscrição, com contagem de obrigatórios já enviados.
export function AnexosChecklist({ tipos, anexos }: AnexosChecklistProps) {
  if (tipos.length === 0) return null

  const tiposObrigatorios = tipos.filter((t) => t.obrigatorio)
  const totalObrigatorios = tiposObrigatorios.length
  const obrigatoriosEnviados = tiposObrigatorios.filter((t) =>
    anexos.some((a) => a.tipo === t.tipo),
  ).length
  const allObrigatoriosOk = obrigatoriosEnviados === totalObrigatorios

  const countByTipo = anexos.reduce<Record<string, number>>((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] ?? 0) + 1
    return acc
  }, {})

  return (
    <div id="tour-nova-anexos-checklist" className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900">
          Documentos necessários
        </h3>
        {totalObrigatorios > 0 && (
          <Badge variant={allObrigatoriosOk ? 'success' : 'warning'} dot>
            {obrigatoriosEnviados}/{totalObrigatorios} obrigatórios enviados
          </Badge>
        )}
      </div>
      <ul className="space-y-2" role="list">
        {tipos.map((t) => {
          const qtd = countByTipo[t.tipo] ?? 0
          const enviado = qtd > 0
          return (
            <li key={t.tipo} className="flex items-start gap-2 text-sm">
              {enviado ? (
                <IconCheck className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
              ) : (
                // Dot indicador de pendência — badge circular permitido pelo guia de estilo
                <span
                  className="h-4 w-4 rounded-full border border-slate-300 shrink-0 mt-0.5" // deslop-ignore 19
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-900">{t.label}</span>
                  {t.obrigatorio ? (
                    <span className="text-xs font-medium text-red-600">Obrigatório</span>
                  ) : (
                    <span className="text-xs text-slate-500">Opcional</span>
                  )}
                  {enviado && (
                    <span className="text-xs font-medium text-brand-700">
                      {qtd === 1 ? '1 arquivo' : `${qtd} arquivos`}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
