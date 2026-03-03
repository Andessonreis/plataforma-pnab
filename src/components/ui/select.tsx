'use client'

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  leftIcon?: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, leftIcon, id, className = '', ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={[error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
            className={[
              'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900',
              'transition-colors appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              'min-h-[44px]',
              'bg-white bg-no-repeat',
              leftIcon ? 'pl-10' : '',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
              className,
            ].join(' ')}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem',
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
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

Select.displayName = 'Select'

export { Select }
export type { SelectProps, SelectOption }
