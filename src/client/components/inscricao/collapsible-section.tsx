'use client'

import { useState, useId, type ReactNode, type KeyboardEvent } from 'react'

interface Props {
  title: string
  subtitle?: string
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Seção colapsável com header clicável e seta indicadora.
 * Suporta teclado (Enter/Espaço) e ARIA.
 */
export function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  const toggle = () => setOpen((v) => !v)

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={onKey}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
        <svg
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={contentId}
        hidden={!open}
        className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-100"
      >
        {children}
      </div>
    </section>
  )
}
