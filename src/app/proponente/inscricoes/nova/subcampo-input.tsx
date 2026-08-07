'use client'

import { Input, Select, Textarea, CurrencyInput } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'

// Campo simples reutilizado dentro de linhas de tabela e itens de grupo repetível.
export function SubCampoInput({
  campo,
  value,
  onChange,
}: {
  campo: CampoFormulario
  value: unknown
  onChange: (v: unknown) => void
}) {
  const str = (value as string) ?? ''

  switch (campo.tipo) {
    case 'textarea':
      return (
        <Textarea
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'select':
      return (
        <Select
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          options={(campo.opcoes || []).map((op): SelectOption => ({ value: op, label: op }))}
          placeholder="Selecione..."
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'moeda':
    case 'currency':
      return (
        <CurrencyInput
          label={campo.label}
          value={str}
          onChange={(raw) => onChange(raw)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'data':
    case 'date':
      return (
        <Input
          label={campo.label}
          type="date"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'numero':
    case 'number':
      return (
        <Input
          label={campo.label}
          type="number"
          min={0}
          value={str}
          onChange={(e) => {
            const v = e.target.value
            // Rejeita números negativos: input "type=number" aceita "-" por padrão
            if (v === '' || Number(v) >= 0) onChange(v)
          }}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    default:
      return (
        <Input
          label={campo.label}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
  }
}
