import type { TipoProponente } from './types'
import { tipoLabels } from './constants'

interface TipoProponenteFieldProps {
  tipo: TipoProponente
  onChange: (tipo: TipoProponente) => void
}

export function TipoProponenteField({ tipo, onChange }: TipoProponenteFieldProps) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-slate-700 mb-2">
        Tipo de proponente
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(tipoLabels) as [TipoProponente, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={[
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
              tipo === value
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
            aria-pressed={tipo === value}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
