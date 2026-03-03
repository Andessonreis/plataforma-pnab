import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-brand-50 text-brand-700 ring-brand-200',
  warning: 'bg-accent-50 text-accent-800 ring-accent-200',
  error:   'bg-red-50 text-red-700 ring-red-200',
  info:    'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-brand-500',
  warning: 'bg-accent-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-slate-400',
}

function Badge({ variant = 'neutral', dot, children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
