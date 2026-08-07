'use client'

import { Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { SubCampoInput } from './subcampo-input'

type LinhaValor = Record<string, unknown>

// Campo do tipo "grupo_repetivel": itens (cards) adicionáveis/removíveis com subcampos.
export function GrupoRepetivelInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: LinhaValor[]
  onChange: (v: LinhaValor[]) => void
}) {
  const itens = Array.isArray(value) ? value : []
  const subcampos = campo.subcampos ?? []
  const itemMin = campo.itemMin ?? 0
  const itemMax = campo.itemMax ?? Infinity
  const labelItem = campo.labelItem ?? 'Item'

  const addItem = () => {
    if (itens.length >= itemMax) return
    const novo: LinhaValor = {}
    for (const sub of subcampos) novo[sub.nome] = ''
    onChange([...itens, novo])
  }

  const removeItem = (i: number) => {
    if (itens.length <= itemMin) return
    onChange(itens.filter((_, idx) => idx !== i))
  }

  const updateField = (i: number, nome: string, v: unknown) => {
    const next = itens.slice()
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
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          + Adicionar {labelItem}
        </Button>
      </div>
      {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}

      {itens.length === 0 ? (
        <p className="text-sm text-slate-500 italic border border-dashed border-slate-200 rounded-lg p-4 text-center">
          Nenhum item. Clique em &ldquo;Adicionar {labelItem}&rdquo; para começar.
        </p>
      ) : (
        <div className="space-y-4">
          {itens.map((item, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900">
                  {labelItem} {i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(i)}
                  disabled={itens.length <= itemMin}
                >
                  Remover
                </Button>
              </div>
              <div className="space-y-3">
                {subcampos.map((sub) => (
                  <SubCampoInput
                    key={sub.nome}
                    campo={sub}
                    value={item[sub.nome]}
                    onChange={(v) => updateField(i, sub.nome, v)}
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
