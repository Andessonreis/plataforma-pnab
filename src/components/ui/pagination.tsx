'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  className?: string
}

function Pagination({ currentPage, totalPages, baseUrl, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

  // Gera os numeros de pagina para exibir
  const pages: (number | 'ellipsis')[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  const separator = baseUrl.includes('?') ? '&' : '?'

  function buildUrl(page: number) {
    // Substitui page param existente ou adiciona
    const url = new URL(baseUrl, 'http://localhost')
    url.searchParams.set('page', String(page))
    return `${url.pathname}${url.search}`
  }

  return (
    <nav aria-label="Paginacao" className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Anterior */}
      {currentPage > 1 ? (
        <a
          href={buildUrl(currentPage - 1)}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Pagina anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
      ) : (
        <span
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
          aria-disabled="true"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </span>
      )}

      {/* Numeros */}
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="inline-flex items-center justify-center min-h-[44px] min-w-[36px] text-sm text-slate-400">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg bg-brand-600 text-sm font-medium text-white"
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <a
            key={page}
            href={buildUrl(page)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {page}
          </a>
        ),
      )}

      {/* Proximo */}
      {currentPage < totalPages ? (
        <a
          href={buildUrl(currentPage + 1)}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Proxima pagina"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      ) : (
        <span
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
          aria-disabled="true"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  )
}

export { Pagination }
export type { PaginationProps }
