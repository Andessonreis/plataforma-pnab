'use client'

import { Input, Select, Textarea, CurrencyInput } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { resolveCharLimits } from '@/lib/campo-limits'
import { formatTelefoneBR } from '@/lib/utils/format'
import type { CampoFormulario } from '@/types/campo-formulario'
import { BlocoInfo } from './bloco-info'
import { TabelaInput } from './tabela-input'
import { GrupoRepetivelInput } from './grupo-repetivel-input'
import { CharCounter } from './char-counter'

interface CampoRendererProps {
  campo: CampoFormulario
  value: unknown
  onChange: (valor: unknown) => void
}

// Renderiza um campo dinâmico do formulário de inscrição de acordo com o seu tipo.
// Elementos estruturais (info/tabela/grupo_repetivel) delegam para os componentes dedicados.
export function CampoRenderer({ campo, value, onChange }: CampoRendererProps) {
  if (campo.tipo === 'info') {
    return <BlocoInfo campo={campo} />
  }
  if (campo.tipo === 'tabela') {
    const valor = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
    return <TabelaInput campo={campo} value={valor} onChange={onChange as (v: Record<string, unknown>[]) => void} />
  }
  if (campo.tipo === 'grupo_repetivel') {
    const valor = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
    return <GrupoRepetivelInput campo={campo} value={valor} onChange={onChange as (v: Record<string, unknown>[]) => void} />
  }

  const str = (value as string) ?? ''

  switch (campo.tipo) {
    case 'texto':
    case 'text': {
      // Nome/label do campo sugere telefone ou e-mail — mesmo sendo um campo
      // dinâmico definido pelo edital, aplica a mesma máscara/teclado do
      // formulário de perfil, em vez de cair num <input> genérico sem ajuda nenhuma.
      const alvo = `${campo.nome} ${campo.label}`
      const ehTelefone = /telefone|whatsapp|celular/i.test(alvo)
      const ehEmail = /e-?mail/i.test(alvo)
      const limits = resolveCharLimits(campo)
      return (
        <div>
          <Input
            label={campo.label}
            type={ehEmail ? 'email' : ehTelefone ? 'tel' : 'text'}
            inputMode={ehTelefone ? 'numeric' : undefined}
            value={str}
            onChange={(e) => onChange(ehTelefone ? formatTelefoneBR(e.target.value) : e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
            maxLength={ehTelefone ? 15 : limits?.maxLength}
          />
          {limits && !ehTelefone && (
            <CharCounter current={str.length} max={limits.maxLength} min={limits.minLength} />
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
            value={str}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            hint={campo.hint}
            maxLength={limits?.maxLength}
          />
          {limits && (
            <CharCounter current={str.length} max={limits.maxLength} min={limits.minLength} />
          )}
        </div>
      )
    }
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
            value={str}
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
          {limits && (
            <CharCounter current={str.length} max={limits.maxLength} min={limits.minLength} />
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
          value={str}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          hint={campo.hint}
        />
      )
    case 'multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : []
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {campo.label}
            {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
          </label>
          {campo.hint && <p className="text-xs text-slate-500 mb-2">{campo.hint}</p>}
          {/* Colunas CSS em vez de lista vertical — listas de 10-15 opções
              (comuns em campos de acessibilidade/público-alvo) viravam uma
              rolagem enorme numa coluna só; cada opção flui pra a coluna com
              espaço, sem forçar alinhamento de linha entre opções de tamanhos
              bem diferentes (o que uma grid rígida faria). */}
          <div className="columns-2 gap-x-4 sm:columns-3">
            {(campo.opcoes || []).map((op) => (
              <label
                key={op}
                className="mb-1 flex min-h-[44px] items-center gap-2 break-inside-avoid text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(op)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, op]
                      : selected.filter((s) => s !== op)
                    onChange(next)
                  }}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus-visible:ring-2 focus-visible:ring-offset-2"
                />
                <span>{op}</span>
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
