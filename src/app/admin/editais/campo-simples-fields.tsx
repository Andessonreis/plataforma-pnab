'use client'

import { Input, Textarea } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { generateFieldName } from '@/lib/utils/slug'

interface CampoSimplesFieldsProps {
  campo: CampoFormulario
  onChange: (patch: Partial<CampoFormulario>) => void
}

// ─── Campos dos tipos simples (texto, número, moeda, data, select, etc.) ────

function CampoSimplesFields({ campo, onChange }: CampoSimplesFieldsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Rótulo (visível)"
          value={campo.label}
          onChange={(e) => {
            const label = e.target.value
            const patch: Partial<CampoFormulario> = { label }
            if (!campo.nome.trim() && label.trim()) patch.nome = generateFieldName(label)
            onChange(patch)
          }}
          placeholder="Ex: Objeto do Projeto"
          required
        />
        <Input
          label="Nome técnico"
          value={campo.nome}
          onChange={(e) => onChange({ nome: generateFieldName(e.target.value) })}
          hint="Gerado automaticamente a partir do rótulo"
        />
      </div>
      <div className="flex items-end gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 min-h-[44px]">
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
            onChange({
              opcoes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
            })
          }
          rows={3}
        />
      )}
      <Input
        label="Texto de ajuda (hint)"
        value={campo.hint ?? ''}
        onChange={(e) => onChange({ hint: e.target.value })}
      />
    </>
  )
}

export { CampoSimplesFields }
export type { CampoSimplesFieldsProps }
