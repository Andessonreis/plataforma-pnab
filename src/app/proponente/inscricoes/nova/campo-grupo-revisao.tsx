'use client'

import type { CampoFormulario } from '@/types/campo-formulario'

type LinhaValor = Record<string, unknown>

// Modo leitura do campo "grupo_repetivel" — usado na revisão da inscrição e no detalhe (admin/avaliador).
export function CampoGrupoRevisao({ campo, linhas }: { campo: CampoFormulario; linhas: LinhaValor[] }) {
  const subcampos = campo.subcampos ?? []
  const labelItem = campo.labelItem ?? 'Item'
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
      </p>
      {linhas.length === 0 ? (
        <p className="text-sm text-red-700 italic">Nenhum item preenchido</p>
      ) : (
        <div className="space-y-3">
          {linhas.map((item, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
              <p className="text-xs font-medium text-slate-500 mb-2">
                {labelItem} {i + 1}
              </p>
              <dl className="space-y-2">
                {subcampos.map((sub) => {
                  const v = item[sub.nome]
                  const empty = v === undefined || v === null || v === ''
                  return (
                    <div key={sub.nome}>
                      <dt className="text-xs text-slate-500">{sub.label}</dt>
                      <dd className={`text-sm ${empty ? 'text-red-700 italic' : 'text-slate-900'} whitespace-pre-wrap break-words`}>
                        {empty ? 'Não preenchido' : Array.isArray(v) ? v.join(', ') : String(v)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
