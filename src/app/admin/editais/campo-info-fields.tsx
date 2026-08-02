'use client'

import { Input, Textarea, Select } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { generateFieldName } from '@/lib/utils/slug'
import { VARIANTE_INFO_OPTIONS } from './campo-formulario-options'

interface CampoInfoFieldsProps {
  campo: CampoFormulario
  index: number
  onChange: (patch: Partial<CampoFormulario>) => void
}

// ─── Campos específicos do tipo "info" (bloco informativo não editável) ─────

function CampoInfoFields({ campo, index, onChange }: CampoInfoFieldsProps) {
  return (
    <>
      <Input
        label="Título (opcional)"
        value={campo.label}
        onChange={(e) => onChange({
          label: e.target.value,
          nome: campo.nome || generateFieldName(e.target.value || `info_${index + 1}`),
        })}
        placeholder="Ex: Atenção!"
      />
      <Select
        label="Variante visual"
        value={campo.variante ?? 'info'}
        onChange={(e) => onChange({ variante: e.target.value as 'info' | 'atencao' | 'alerta' })}
        options={VARIANTE_INFO_OPTIONS}
      />
      <Textarea
        label="Conteúdo (markdown aceito)"
        value={campo.conteudo ?? ''}
        onChange={(e) => onChange({ conteudo: e.target.value })}
        rows={6}
        placeholder="Texto explicativo exibido ao proponente..."
      />
    </>
  )
}

export { CampoInfoFields }
export type { CampoInfoFieldsProps }
