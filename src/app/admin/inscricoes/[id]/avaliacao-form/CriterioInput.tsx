import type { CriterioConfig } from './types'

interface CriterioInputProps {
  criterio: CriterioConfig
  idx: number
  value: number
  onChange: (criterio: string, value: number) => void
}

export function CriterioInput({ criterio: c, idx, value: notaVal, onChange }: CriterioInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`nota-${idx}`}
            className="text-sm font-medium text-slate-800"
          >
            {c.criterio}
          </label>
          {c.descricao && (
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{c.descricao}</p>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
          peso {c.peso}
        </span>
      </div>

      {c.modo === 'discreto' ? (
        /* Radio buttons para scoring discreto */
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Nota para ${c.criterio}`}>
          {[
            { label: 'Não Atende', value: c.naoAtende ?? 0 },
            { label: 'Parcial', value: c.parcial ?? 0 },
            { label: 'Plenamente', value: c.plenamente ?? c.notaMax },
          ].map((option) => {
            const isSelected = notaVal === option.value
            return (
              <label
                key={option.label}
                className={[
                  'flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all',
                  isSelected
                    ? option.value === 0
                      ? 'border-red-300 bg-red-50 text-red-800 ring-1 ring-red-300'
                      : option.label === 'Parcial'
                        ? 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-300'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={`nota-${idx}`}
                  checked={isSelected}
                  onChange={() => onChange(c.criterio, option.value)}
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
                <span className={[
                  'text-xs font-bold tabular-nums',
                  isSelected ? '' : 'text-slate-400',
                ].join(' ')}>
                  ({option.value} pts)
                </span>
              </label>
            )
          })}
        </div>
      ) : (
        /* Slider para scoring livre */
        <div className="flex items-center gap-3">
          <input
            type="range"
            id={`nota-${idx}`}
            min={0}
            max={c.notaMax}
            step={0.5}
            value={notaVal}
            onChange={(e) => onChange(c.criterio, parseFloat(e.target.value))}
            className="flex-1 h-1.5 accent-brand-600 cursor-pointer"
            aria-label={`Nota para ${c.criterio}`}
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={c.notaMax}
              step={0.5}
              value={notaVal}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) onChange(c.criterio, Math.min(c.notaMax, Math.max(0, v)))
              }}
              className={[
                'w-14 text-center text-sm font-bold rounded-lg border px-1.5 py-1 tabular-nums',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                notaVal >= 7
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : notaVal >= 5
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700',
              ].join(' ')}
              aria-label={`Valor numérico para ${c.criterio}`}
            />
            <span className="text-xs text-slate-400">/{c.notaMax}</span>
          </div>
        </div>
      )}
    </div>
  )
}
