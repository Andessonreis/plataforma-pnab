'use client'

import { Input, Textarea, Button, Select } from '@client/components/ui'
import type { CampoFormulario, CampoTipo } from '@shared/types/campo-formulario'
import { TIPO_CAMPO_SIMPLES_OPTIONS, slugify } from './constants'

// ─── Editor de subcampo simples (usado em colunas de tabela e subcampos de grupo) ─

export function SubcampoEditor({
  campo,
  onChange,
  onRemove,
  prefixLabel,
}: {
  campo: CampoFormulario
  onChange: (patch: Partial<CampoFormulario>) => void
  onRemove: () => void
  prefixLabel: string
}) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{prefixLabel}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-xs font-medium"
        >
          Remover
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Rótulo"
          value={campo.label}
          onChange={(e) => {
            const label = e.target.value
            const patch: Partial<CampoFormulario> = { label }
            if (!campo.nome.trim() && label.trim()) patch.nome = slugify(label)
            onChange(patch)
          }}
          placeholder="Ex: Nome"
          required
        />
        <Input
          label="Nome técnico"
          value={campo.nome}
          onChange={(e) => onChange({ nome: slugify(e.target.value) })}
          hint="Gerado automaticamente"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Tipo"
          value={campo.tipo}
          onChange={(e) => onChange({ tipo: e.target.value as CampoTipo })}
          options={TIPO_CAMPO_SIMPLES_OPTIONS}
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 self-end min-h-[44px]">
          <input
            type="checkbox"
            checked={campo.obrigatorio ?? false}
            onChange={(e) => onChange({ obrigatorio: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Obrigatório
        </label>
      </div>
      {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
        <Textarea
          label="Opções (uma por linha)"
          value={(campo.opcoes ?? []).join('\n')}
          onChange={(e) =>
            onChange({ opcoes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })
          }
          rows={3}
          placeholder="Opção A&#10;Opção B"
        />
      )}
      <Input
        label="Hint"
        value={campo.hint ?? ''}
        onChange={(e) => onChange({ hint: e.target.value })}
        placeholder="Instrução opcional"
      />
    </div>
  )
}

// ─── Editor de lista de subcampos (colunas ou subcampos) ────────────────────

export function SubcamposListEditor({
  items,
  onChange,
  labelSingular,
  labelPlural,
}: {
  items: CampoFormulario[]
  onChange: (next: CampoFormulario[]) => void
  labelSingular: string
  labelPlural: string
}) {
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
