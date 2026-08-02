'use client'

import { Input } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { generateFieldName } from '@/lib/utils/slug'
import { SubcamposListEditor } from './subcampos-list-editor'

interface CampoGrupoFieldsProps {
  campo: CampoFormulario
  onChange: (patch: Partial<CampoFormulario>) => void
}

// ─── Campos específicos do tipo "grupo_repetivel" (itens repetidos N vezes) ─

function CampoGrupoFields({ campo, onChange }: CampoGrupoFieldsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Rótulo (título do bloco)"
          value={campo.label}
          onChange={(e) => {
            const label = e.target.value
            const patch: Partial<CampoFormulario> = { label }
            if (!campo.nome.trim() && label.trim()) patch.nome = generateFieldName(label)
            onChange(patch)
          }}
          placeholder="Ex: Planos de Formação"
          required
        />
        <Input
          label="Nome técnico"
          value={campo.nome}
          onChange={(e) => onChange({ nome: generateFieldName(e.target.value) })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Nome singular do item"
          value={campo.labelItem ?? ''}
          onChange={(e) => onChange({ labelItem: e.target.value })}
          placeholder="Ex: Plano"
          hint="Usado no botão '+ Adicionar X'"
        />
        <Input
          label="Hint (opcional)"
          value={campo.hint ?? ''}
          onChange={(e) => onChange({ hint: e.target.value })}
        />
      </div>
      <SubcamposListEditor
        items={campo.subcampos ?? []}
        onChange={(subs) => onChange({ subcampos: subs })}
        labelSingular="Campo"
        labelPlural="Campos de cada item"
      />
    </>
  )
}

export { CampoGrupoFields }
export type { CampoGrupoFieldsProps }
