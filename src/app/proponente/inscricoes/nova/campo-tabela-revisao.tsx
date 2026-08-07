'use client'

import type { CampoFormulario } from '@/types/campo-formulario'

type LinhaValor = Record<string, unknown>

// Modo leitura do campo "tabela" — usado na revisão da inscrição e no detalhe (admin/avaliador).
export function CampoTabelaRevisao({ campo, linhas }: { campo: CampoFormulario; linhas: LinhaValor[] }) {
  const colunas = campo.colunas ?? []
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
      </p>
      {linhas.length === 0 ? (
        <p className="text-sm text-red-700 italic">Nenhuma linha preenchida</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                {colunas.map((col) => (
                  <th key={col.nome} className="text-left font-medium text-slate-700 px-3 py-2 border border-slate-200">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, i) => (
                <tr key={i}>
                  {colunas.map((col) => {
                    const v = linha[col.nome]
                    const str = v === undefined || v === null || v === ''
                      ? '—'
                      : Array.isArray(v) ? v.join(', ') : String(v)
                    return (
                      <td key={col.nome} className="px-3 py-2 border border-slate-200 text-slate-900 align-top whitespace-pre-wrap break-words">
                        {str}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
