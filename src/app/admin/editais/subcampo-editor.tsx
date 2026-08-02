'use client'

import { Input, Textarea, Select } from '@/components/ui'
import type { CampoFormulario, CampoTipo } from '@/types/campo-formulario'
import { generateFieldName } from '@/lib/utils/slug'
import { TIPO_CAMPO_SIMPLES_OPTIONS } from './campo-formulario-options'

interface SubcampoEditorProps {
  campo: CampoFormulario
  onChange: (patch: Partial<CampoFormulario>) => void
  onRemove: () => void
  prefixLabel: string
}

// ─── Editor de subcampo simples (usado em colunas de tabela e subcampos de grupo) ─

function SubcampoEditor({ campo, onChange, onRemove, prefixLabel }: SubcampoEditorProps) {
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Rótulo"
          value={campo.label}
          onChange={(e) => {
            const label = e.target.value
            const patch: Partial<CampoFormulario> = { label }
            if (!campo.nome.trim() && label.trim()) patch.nome = generateFieldName(label)
            onChange(patch)
          }}
          placeholder="Ex: Nome"
          required
        />
        <Input
          label="Nome técnico"
          value={campo.nome}
          onChange={(e) => onChange({ nome: generateFieldName(e.target.value) })}
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

export { SubcampoEditor }
export type { SubcampoEditorProps }
