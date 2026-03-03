import Link from 'next/link'

interface Tab {
  key: string
  label: string
  href: string
}

interface FilterTabsProps {
  tabs: Tab[]
  activeKey: string
  ariaLabel: string
}

function FilterTabs({ tabs, activeKey, ariaLabel }: FilterTabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="inline-flex rounded-lg bg-slate-200/60 p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              'px-4 py-2 text-sm font-medium rounded-md transition-all min-h-[44px] inline-flex items-center',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { FilterTabs }
export type { FilterTabsProps }
