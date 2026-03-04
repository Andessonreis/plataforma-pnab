'use client'

import { useEffect, useState } from 'react'

const FONT_SIZE_KEY = 'pnab-font-size'
const HIGH_CONTRAST_KEY = 'pnab-high-contrast'

/** Classes CSS aplicadas ao <html> conforme o nível de fonte */
const fontSizeClasses: Record<number, string | null> = {
  0: null,
  1: 'font-size-large',
  2: 'font-size-xl',
}

/**
 * Controles de acessibilidade — aumentar/diminuir fonte e alto contraste.
 * Preferências salvas em localStorage e aplicadas via classes no <html>.
 */
function AccessibilityControls() {
  const [fontSize, setFontSize] = useState(0)
  const [highContrast, setHighContrast] = useState(false)

  // Carrega preferências salvas no mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY)
    const savedContrast = localStorage.getItem(HIGH_CONTRAST_KEY)

    if (savedFontSize !== null) {
      const level = Number(savedFontSize)
      if (level >= 0 && level <= 2) {
        setFontSize(level)
        applyFontSize(level)
      }
    }

    if (savedContrast === 'true') {
      setHighContrast(true)
      document.documentElement.classList.add('high-contrast')
    }
  }, [])

  function applyFontSize(level: number) {
    const root = document.documentElement

    // Remove todas as classes de fonte antes de aplicar
    root.classList.remove('font-size-large', 'font-size-xl')

    const cls = fontSizeClasses[level]
    if (cls) {
      root.classList.add(cls)
    }
  }

  function handleIncrease() {
    const next = Math.min(fontSize + 1, 2)
    setFontSize(next)
    applyFontSize(next)
    localStorage.setItem(FONT_SIZE_KEY, String(next))
  }

  function handleDecrease() {
    const next = Math.max(fontSize - 1, 0)
    setFontSize(next)
    applyFontSize(next)
    localStorage.setItem(FONT_SIZE_KEY, String(next))
  }

  function handleContrast() {
    const next = !highContrast
    setHighContrast(next)

    if (next) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    localStorage.setItem(HIGH_CONTRAST_KEY, String(next))
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded px-2 py-1 text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[28px]"
        aria-label="Aumentar fonte"
        onClick={handleIncrease}
      >
        A+
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded px-2 py-1 text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[28px]"
        aria-label="Diminuir fonte"
        onClick={handleDecrease}
      >
        A-
      </button>
      <span className="h-3 w-px bg-white/20 mx-1" aria-hidden="true" />
      <button
        type="button"
        className={[
          'inline-flex items-center justify-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors min-h-[28px]',
          highContrast
            ? 'text-white bg-white/15'
            : 'text-white/80 hover:text-white hover:bg-white/10',
        ].join(' ')}
        aria-label="Alto contraste"
        aria-pressed={highContrast}
        onClick={handleContrast}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
        <span className="hidden sm:inline">Contraste</span>
      </button>
    </div>
  )
}

export { AccessibilityControls }
