'use client'

// Contador de caracteres com aviso de mínimo/máximo — usado nos campos de texto e textarea do formulário dinâmico.
export function CharCounter({ current, max, min }: { current: number; max: number; min?: number }) {
  const remaining = max - current
  const isTooLong = remaining < 0
  const isNearLimit = remaining >= 0 && remaining <= Math.ceil(max * 0.1)
  const isTooShort = min != null && min > 0 && current > 0 && current < min

  return (
    <div className="flex justify-between mt-1 text-xs" aria-live="polite">
      {isTooShort ? (
        <span className="text-accent-700">
          Mínimo de {min} caracteres ({min! - current} restantes)
        </span>
      ) : <span />}
      <span
        className={
          isTooLong ? 'text-red-600 font-medium' :
          isNearLimit ? 'text-accent-700' :
          'text-slate-500'
        }
      >
        {current}/{max}
      </span>
    </div>
  )
}
