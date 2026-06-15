'use client'

import type { ReactNode } from 'react'

export function SectionHeader({ number, title, collapsed, onToggle, actions, children }: {
  number: number
  title: string
  collapsed: boolean
  onToggle: () => void
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 group text-left"
        >
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
            {number}. {title}
          </h2>
        </button>
        {!collapsed && actions}
      </div>
      {!collapsed && children}
    </>
  )
}
