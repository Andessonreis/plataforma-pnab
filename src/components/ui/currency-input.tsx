'use client'

import { useCallback, forwardRef, type ReactNode } from 'react'

export interface CurrencyInputProps {
  label: string
  /** Valor numérico em centavos ou decimal (ex: 150000 = R$ 1.500,00) */
  value: string | number | undefined
  onChange: (rawValue: string, numericValue: number) => void
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  placeholder?: string
  leftIcon?: ReactNode
}

// ─── Formatação BRL ──────────────────────────────────────────────────────────

/** Formata número para exibição BRL (ex: 1500.5 → "1.500,50") */
function formatBRL(cents: number): string {
  if (isNaN(cents) || cents === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/** Remove tudo que não é dígito da string */
function digitsOnly(str: string): string {
  return str.replace(/\D/g, '')
}

/**
 * Converte valor armazenado (string numérica como "1500.50" ou "150050" cents)
 * para centavos inteiros para a máscara.
 */
function toCents(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0
  const str = String(value).replace(',', '.')
  const numeric = parseFloat(str)
  if (isNaN(numeric)) return 0
  // Se vier como decimal (ex: "1500.50"), multiplica por 100
  // Se vier já como inteiro muito grande assume que são centavos
  return Math.round(numeric * 100)
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Input de valor monetário com máscara BRL automática.
 * Armazena o valor como decimal (ex: "1500.50") e exibe como "R$ 1.500,50".
 * Compatível com a API do componente `Input` existente.
 */
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      value,
      onChange,
      error,
      hint,
      required,
      disabled,
      id,
      placeholder = 'R$ 0,00',
      leftIcon,
    },
    ref,
  ) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    // Valor exibido: formatar do valor do state
    const displayValue = value !== undefined && value !== '' && value !== '0'
      ? formatBRL(toCents(value))
      : ''

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = digitsOnly(e.target.value)
        const cents = parseInt(raw || '0', 10)
        const decimal = (cents / 100).toFixed(2) // ex: "1500.50"
        onChange(decimal, cents / 100)
      },
      [onChange],
    )

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative">
          {/* Prefixo R$ fixo */}
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 select-none pointer-events-none"
            aria-hidden="true"
          >
            R$
          </span>

          {leftIcon && (
            <span
              className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={displayValue}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder.replace('R$ ', '')}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined
            }
            className={[
              'block w-full rounded-lg border py-2.5 text-sm text-slate-900',
              'pl-10 pr-3', // espaço para prefixo R$
              'placeholder:text-slate-400',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'min-h-[44px]',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            ].join(' ')}
          />
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }

// ─── Utilitário de formatação (uso no PDF / revisão) ─────────────────────────

/** Formata valor decimal para exibição como moeda BRL (ex: 1500.5 → "R$ 1.500,50") */
export function formatCurrencyBRL(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '—'
  const numeric = parseFloat(String(value).replace(',', '.'))
  if (isNaN(numeric)) return String(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeric)
}
