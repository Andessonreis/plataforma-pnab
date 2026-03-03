import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, PageHeader, EmptyState, Pagination } from '@/components/ui'
import { IconNews } from '@/components/ui/icons'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Notícias — Portal PNAB Irecê',
  description:
    'Acompanhe as últimas notícias sobre editais, eventos culturais e a política de fomento à cultura em Irecê/BA.',
}

const PAGE_SIZE = 9

interface NoticiasPageProps {
  searchParams: Promise<{ page?: string }>
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
      <PageHeader
        title="Notícias"
        subtitle="Acompanhe as novidades sobre editais, eventos culturais e a política de fomento à cultura em Irecê."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Notícias' },
        ]}
      />

      {/* Conteúdo */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {noticias.length === 0 ? (
            <EmptyState
              icon={<IconNews className="h-8 w-8 text-slate-400" />}
              title="Nenhuma notícia publicada ainda"
              description="Em breve publicaremos notícias sobre editais e eventos culturais em Irecê."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {noticias.map((noticia) => (
                  <Link
                    key={noticia.id}
                    href={`/noticias/${noticia.slug}`}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
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
                          <IconNews className="h-12 w-12 text-brand-300" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
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

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="/noticias"
                  className="mt-12"
                />
              )}

              <p className="mt-4 text-center text-sm text-slate-500">
                Página {currentPage} de {totalPages} ({total} {total === 1 ? 'notícia' : 'notícias'})
              </p>
            </>
          )}
        </div>
      </section>
    </>
  )
}
