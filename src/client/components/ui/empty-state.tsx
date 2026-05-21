import type { ReactNode } from 'react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      {icon && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {title}
      </h2>
      <p className="text-slate-600 max-w-md mx-auto mb-6">
        {description}
      </p>
      {action && (
        <Button href={action.href}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
