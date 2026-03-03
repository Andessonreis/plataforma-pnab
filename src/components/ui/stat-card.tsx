import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card } from './card'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number | string
  sub?: string
  href?: string
  color: string       // ex: 'bg-brand-50'
  iconColor?: string  // ex: 'text-brand-600'
}

function StatCardContent({ icon, label, value, sub, color, iconColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={`rounded-lg p-3 ${color}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

function StatCard(props: StatCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block group">
        <Card hover padding="md" className="transition-transform duration-200 group-hover:-translate-y-0.5">
          <StatCardContent {...props} />
        </Card>
      </Link>
    )
  }

  return (
    <Card padding="md">
      <StatCardContent {...props} />
    </Card>
  )
}

export { StatCard }
export type { StatCardProps }
