import { StatCard, StaggerContainer, StaggerItem } from '@client/components/ui'
import type { StatCardProps } from '@client/components/ui'

export function KpiGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat) => (
        <StaggerItem key={stat.label}>
          <StatCard {...stat} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
