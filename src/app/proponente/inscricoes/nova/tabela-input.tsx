'use client'

import { Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { SubCampoInput } from './subcampo-input'

type LinhaValor = Record<string, unknown>

// Campo do tipo "tabela": linhas adicionáveis/removíveis com colunas pré-definidas pelo edital.
export function TabelaInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: LinhaValor[]
  onChange: (v: LinhaValor[]) => void
}) {
  const linhas = Array.isArray(value) ? value : []
  const colunas = campo.colunas ?? []
  const linhaMin = campo.linhaMin ?? 0
  const linhaMax = campo.linhaMax ?? Infinity

  const addLinha = () => {
    if (linhas.length >= linhaMax) return
    const nova: LinhaValor = {}
    for (const col of colunas) nova[col.nome] = ''
    onChange([...linhas, nova])
  }

  const removeLinha = (i: number) => {
    if (linhas.length <= linhaMin) return
    onChange(linhas.filter((_, idx) => idx !== i))
  }

  const updateCell = (i: number, nome: string, v: unknown) => {
    const next = linhas.slice()
    next[i] = { ...next[i], [nome]: v }
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">
          {campo.label}
          {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={addLinha}>
          + Adicionar linha
        </Button>
      </div>
      {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}

      {linhas.length === 0 ? (
        <p className="text-sm text-slate-500 italic border border-dashed border-slate-200 rounded-lg p-4 text-center">
          Nenhuma linha. Clique em &ldquo;Adicionar linha&rdquo; para começar.
        </p>
      ) : (
        <div className="space-y-3">
          {linhas.map((linha, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Linha {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLinha(i)}
                  disabled={linhas.length <= linhaMin}
                >
                  Remover
                </Button>
              </div>
              {/* Grid de campos de uma única linha da tabela, não cards de marketing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"> {/* deslop-ignore 28 */}
                {colunas.map((col) => (
                  <SubCampoInput
                    key={col.nome}
                    campo={col}
                    value={linha[col.nome]}
                    onChange={(v) => updateCell(i, col.nome, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
