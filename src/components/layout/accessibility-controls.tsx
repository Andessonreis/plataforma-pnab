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
    <div className="hidden sm:flex items-center gap-4">
      <button
        type="button"
        className="text-xs hover:text-brand-300 transition-colors"
        aria-label="Aumentar fonte"
        onClick={handleIncrease}
      >
        A+
      </button>
      <button
        type="button"
        className="text-xs hover:text-brand-300 transition-colors"
        aria-label="Diminuir fonte"
        onClick={handleDecrease}
      >
        A-
      </button>
      <button
        type="button"
        className="text-xs hover:text-brand-300 transition-colors"
        aria-label="Alto contraste"
        onClick={handleContrast}
      >
        Contraste
      </button>
    </div>
  )
}

export { AccessibilityControls }
