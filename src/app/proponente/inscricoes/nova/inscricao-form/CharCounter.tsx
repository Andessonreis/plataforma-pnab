export function CharCounter({ current, max, min }: { current: number; max: number; min?: number }) {
  const remaining = max - current
  const isTooLong = remaining < 0
  const isNearLimit = remaining >= 0 && remaining <= Math.ceil(max * 0.1)
  const isTooShort = min != null && min > 0 && current > 0 && current < min

  return (
    <div className="flex justify-between mt-1 text-xs" aria-live="polite">
      {isTooShort ? (
        <span className="text-amber-600">
          Mínimo de {min} caracteres ({min! - current} restantes)
        </span>
      ) : <span />}
      <span
        className={
          isTooLong ? 'text-red-600 font-medium' :
          isNearLimit ? 'text-amber-600' :
          'text-slate-400'
        }
      >
        {current}/{max}
      </span>
    </div>
  )
}
