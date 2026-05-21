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
    <div className="flex items-center gap-2.5 sm:gap-4">
      <div className={`hidden sm:flex rounded-xl p-2.5 ${color} shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs sm:text-sm font-medium text-slate-700 leading-tight">{label}</p>
        {sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  )
}

function StatCard(props: StatCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block group">
        <Card hover padding="sm" className="sm:p-6 transition-transform duration-200 group-hover:-translate-y-0.5">
          <StatCardContent {...props} />
        </Card>
      </Link>
    )
  }

  return (
    <Card padding="sm" className="sm:p-6">
      <StatCardContent {...props} />
    </Card>
  )
}

export { StatCard }
export type { StatCardProps }
