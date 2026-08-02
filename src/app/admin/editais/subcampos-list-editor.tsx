'use client'

import { Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { SubcampoEditor } from './subcampo-editor'

interface SubcamposListEditorProps {
  items: CampoFormulario[]
  onChange: (next: CampoFormulario[]) => void
  labelSingular: string
  labelPlural: string
}

// ─── Editor de lista de subcampos (colunas ou subcampos) ────────────────────

function SubcamposListEditor({ items, onChange, labelSingular, labelPlural }: SubcamposListEditorProps) {
  const add = () => {
    const novo: CampoFormulario = { nome: '', label: '', tipo: 'texto', obrigatorio: false }
    onChange([...items, novo])
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<CampoFormulario>) => {
    onChange(items.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  return (
    <div className="space-y-3 pl-3 border-l-2 border-brand-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">{labelPlural}</p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          + Adicionar {labelSingular}
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-slate-400 italic">
          Nenhum {labelSingular.toLowerCase()} configurado.
        </p>
      )}
      {items.map((item, i) => (
        <SubcampoEditor
          key={i}
          campo={item}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
          prefixLabel={`${labelSingular} ${i + 1}`}
        />
      ))}
    </div>
  )
}

export { SubcamposListEditor }
export type { SubcamposListEditorProps }
