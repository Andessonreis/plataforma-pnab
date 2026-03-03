import type { ReactNode } from 'react'
import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  children?: ReactNode
}

function PageHeader({ title, subtitle, breadcrumbs, children }: PageHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-brand-200">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white font-medium truncate max-w-[250px]" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </section>
  )
}

export { PageHeader }
export type { PageHeaderProps }
