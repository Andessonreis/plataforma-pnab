'use client'

import { Input } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { generateFieldName } from '@/lib/utils/slug'
import { SubcamposListEditor } from './subcampos-list-editor'

interface CampoTabelaFieldsProps {
  campo: CampoFormulario
  onChange: (patch: Partial<CampoFormulario>) => void
}

// ─── Campos específicos do tipo "tabela" (linhas com colunas pré-definidas) ─

function CampoTabelaFields({ campo, onChange }: CampoTabelaFieldsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Rótulo (título da tabela)"
          value={campo.label}
          onChange={(e) => {
            const label = e.target.value
            const patch: Partial<CampoFormulario> = { label }
            if (!campo.nome.trim() && label.trim()) patch.nome = generateFieldName(label)
            onChange(patch)
          }}
          placeholder="Ex: Equipe"
          required
        />
        <Input
          label="Nome técnico"
          value={campo.nome}
          onChange={(e) => onChange({ nome: generateFieldName(e.target.value) })}
        />
      </div>
      <Input
        label="Hint (opcional)"
        value={campo.hint ?? ''}
        onChange={(e) => onChange({ hint: e.target.value })}
      />
      <SubcamposListEditor
        items={campo.colunas ?? []}
        onChange={(cols) => onChange({ colunas: cols })}
        labelSingular="Coluna"
        labelPlural="Colunas da tabela"
      />
    </>
  )
}

export { CampoTabelaFields }
export type { CampoTabelaFieldsProps }
