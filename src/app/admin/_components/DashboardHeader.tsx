import { FadeIn } from '@client/components/ui'

export function DashboardHeader({
  today,
  title,
  subtitle,
}: {
  today: string
  title: string
  subtitle: string
}) {
  return (
    <FadeIn>
      <div className="mb-6 sm:mb-8">
        <p className="text-sm text-slate-500 capitalize mb-1">{today}</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
    </FadeIn>
  )
}
