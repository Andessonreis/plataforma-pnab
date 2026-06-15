import { Input, Select, Textarea, CurrencyInput } from '@client/components/ui'
import type { SelectOption } from '@client/components/ui'
import { resolveCharLimits } from '@shared/campo-limits'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import { BlocoInfo, TabelaInput, GrupoRepetivelInput } from '../campo-estrutura'
import { CharCounter } from './CharCounter'

export function CampoRenderer({
  campo,
  value: rawValue,
  onChange,
}: {
  campo: CampoFormulario
  value: unknown
  onChange: (valor: unknown) => void
}) {
  // Elementos estruturais — tratados antes do switch por tipo simples
  if (campo.tipo === 'info') {
    return <BlocoInfo campo={campo} />
  }
  if (campo.tipo === 'tabela') {
    const valor = Array.isArray(rawValue) ? rawValue as Record<string, unknown>[] : []
    return (
      <TabelaInput
        campo={campo}
        value={valor}
        onChange={(v) => onChange(v)}
      />
    )
  }
  if (campo.tipo === 'grupo_repetivel') {
    const valor = Array.isArray(rawValue) ? rawValue as Record<string, unknown>[] : []
    return (
      <GrupoRepetivelInput
        campo={campo}
        value={valor}
        onChange={(v) => onChange(v)}
      />
    )
  }

  const value = (rawValue as string) ?? ''

  switch (campo.tipo) {
    case 'texto':
    case 'text': {
      const limits = resolveCharLimits(campo)
      return (
        <div>
          <Input
            label={campo.label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
            maxLength={limits?.maxLength}
          />
          {limits && (
            <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
          )}
        </div>
      )
    }
    case 'textarea': {
      const limits = resolveCharLimits(campo)
      return (
        <div>
          <Textarea
            label={campo.label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
            maxLength={limits?.maxLength}
          />
          {limits && (
            <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
          )}
        </div>
      )
    }
    case 'select':
      return (
        <Select
          label={campo.label}
          value={value}
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
          value={value}
          onChange={(rawValue) => onChange(rawValue)}
          placeholder={campo.placeholder}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'numero':
    case 'number': {
      // Campos cujo nome sugere valor monetário recebem máscara BRL automaticamente
      const isCurrency = /valor|preco|preço|custo|orcamento|orçamento/i.test(campo.nome)
      if (isCurrency) {
        return (
          <CurrencyInput
            label={campo.label}
            value={value}
            onChange={(rawValue) => onChange(rawValue)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
        )
      }
      const limits = resolveCharLimits(campo)
      return (
        <div>
          <Input
            label={campo.label}
            type="number"
            min={0}
            value={value}
            onChange={(e) => {
              const v = e.target.value
              // Rejeita números negativos: input "type=number" aceita "-" por padrão
              if (v === '' || Number(v) >= 0) onChange(v)
            }}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
          />
          {limits && (
            <CharCounter current={value.length} max={limits.maxLength} min={limits.minLength} />
          )}
        </div>
      )
    }
    case 'data':
    case 'date':
      return (
        <Input
          label={campo.label}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'multiselect': {
      const selected = Array.isArray(rawValue) ? rawValue as string[] : []
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {campo.label}
            {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
          </label>
          {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}
          <div className="space-y-2">
            {(campo.opcoes || []).map((op) => (
              <label key={op} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.includes(op)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, op]
                      : selected.filter((s) => s !== op)
                    onChange(next)
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {op}
              </label>
            ))}
          </div>
        </div>
      )
    }
    case 'arquivo':
      // Arquivos são tratados na etapa de anexos
      return null
    default:
      return null
  }
}
