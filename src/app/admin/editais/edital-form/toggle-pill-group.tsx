interface TogglePillGroupProps<T extends string> {
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
  ariaLabel?: string
}

/** Grupo de pills toggle multi-seleção (tipos de proponente, categorias, etc.). */
export function TogglePillGroup<T extends string>({
  options,
  selected,
  onToggle,
  ariaLabel,
}: TogglePillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            aria-pressed={isSelected}
            className={[
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px]',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              isSelected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
