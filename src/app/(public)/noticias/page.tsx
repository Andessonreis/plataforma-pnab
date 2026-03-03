import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Noticias — Portal PNAB Irece',
  description:
    'Acompanhe as ultimas noticias sobre editais, eventos culturais e a politica de fomento a cultura em Irece/BA.',
}

const PAGE_SIZE = 9

interface NoticiasPageProps {
  searchParams: Promise<{ page?: string }>
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const where = {
    publicado: true,
    publicadoEm: { not: null },
  }

  const [noticias, total] = await Promise.all([
    prisma.noticia.findMany({
      where,
      orderBy: { publicadoEm: 'desc' },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        titulo: true,
        slug: true,
        corpo: true,
        tags: true,
        imagemUrl: true,
        publicadoEm: true,
      },
    }),
    prisma.noticia.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <nav className="mb-4 text-sm text-brand-200" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium">Noticias</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Noticias
          </h1>
          <p className="mt-3 text-lg text-brand-100 max-w-2xl">
            Acompanhe as novidades sobre editais, eventos culturais e a politica de
            fomento a cultura em Irece.
          </p>
        </div>
      </section>

      {/* Conteudo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {noticias.length === 0 ? (
            /* Estado vazio */
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Nenhuma noticia publicada ainda
              </h2>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                Em breve publicaremos noticias sobre editais e eventos culturais em
                Irece.
              </p>
            </div>
          ) : (
            <>
              {/* Grid de noticias */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {noticias.map((noticia) => (
                  <Link
                    key={noticia.id}
                    href={`/noticias/${noticia.slug}`}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    {/* Imagem ou placeholder */}
                    <div className="relative h-48 overflow-hidden">
                      {noticia.imagemUrl ? (
                        <img
                          src={noticia.imagemUrl}
                          alt={noticia.titulo}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 flex items-center justify-center">
                          <svg className="h-12 w-12 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Corpo do card */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Tags */}
                      {noticia.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {noticia.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="neutral">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                        {noticia.titulo}
                      </h2>

                      <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                        {truncateText(noticia.corpo.replace(/[#*_`]/g, ''), 150)}
                      </p>

                      {/* Data */}
                      {noticia.publicadoEm && (
                        <time
                          dateTime={noticia.publicadoEm.toISOString()}
                          className="mt-4 block text-xs text-slate-400"
                        >
                          {formatDate(noticia.publicadoEm)}
                        </time>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Paginacao */}
              {totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginacao">
                  {currentPage > 1 && (
                    <Link
                      href={`/noticias?page=${currentPage - 1}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                      </svg>
                      Anterior
                    </Link>
                  )}

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`/noticias?page=${page}`}
                        className={[
                          'inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
                          page === currentPage
                            ? 'bg-brand-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </Link>
                    ))}
                  </div>

                  {currentPage < totalPages && (
                    <Link
                      href={`/noticias?page=${currentPage + 1}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      Proxima
                      <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  )}
                </nav>
              )}

              {/* Contagem de paginas */}
              <p className="mt-4 text-center text-sm text-slate-500">
                Pagina {currentPage} de {totalPages} ({total} {total === 1 ? 'noticia' : 'noticias'})
              </p>
            </>
          )}
        </div>
      </section>
    </>
  )
}
