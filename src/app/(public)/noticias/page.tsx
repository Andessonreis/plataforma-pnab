import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, PageHeader, EmptyState, Pagination } from '@/components/ui'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated'
import { IconNews, IconCalendar, IconArrowRight } from '@/components/ui/icons'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = {
  title: 'Notícias',
  description:
    'Acompanhe as últimas notícias sobre editais, eventos culturais e a política de fomento à cultura em Irecê/BA.',
}

const PAGE_SIZE = 9

interface NoticiasPageProps {
  searchParams: Promise<{ page?: string }>
}

function truncateText(text: string, maxLength: number): string {
  const clean = text.replace(/[#*_`]/g, '')
  if (clean.length <= maxLength) return clean
  return clean.substring(0, maxLength).trimEnd() + '...'
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

  // Separar a primeira notícia (destaque) das demais
  const [featured, ...rest] = noticias

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

      <section className="bg-slate-50 py-6 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Contador */}
          <FadeIn>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <p className="text-sm text-slate-500">
                {total} {total === 1 ? 'notícia publicada' : 'notícias publicadas'}
              </p>
            </div>
          </FadeIn>

          {noticias.length === 0 ? (
            <EmptyState
              icon={<IconNews className="h-8 w-8 text-slate-400" />}
              title="Nenhuma notícia publicada ainda"
              description="Em breve publicaremos notícias sobre editais e eventos culturais em Irecê."
            />
          ) : (
            <>
              {/* Card destaque — primeira notícia */}
              {currentPage === 1 && featured && (
                <FadeIn delay={0.1}>
                  <Link
                    href={`/noticias/${featured.slug}`}
                    className="group block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden mb-8 sm:mb-10"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="relative h-48 sm:h-64 lg:h-full min-h-[200px] sm:min-h-[300px] overflow-hidden">
                        {featured.imagemUrl ? (
                          <Image
                            src={featured.imagemUrl}
                            alt={featured.titulo}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center">
                            <IconNews className="h-20 w-20 text-white/30" />
                          </div>
                        )}
                        {/* Overlay gradiente sutil */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
                        {/* Badge destaque */}
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-accent-500/25">
                            Destaque
                          </span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
                        {featured.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {featured.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="neutral">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 group-hover:text-brand-700 transition-colors leading-tight">
                          {featured.titulo}
                        </h2>

                        <p className="mt-4 text-base text-slate-600 leading-relaxed">
                          {truncateText(featured.corpo, 250)}
                        </p>

                        <div className="mt-6 flex items-center justify-between">
                          {featured.publicadoEm && (
                            <time
                              dateTime={featured.publicadoEm.toISOString()}
                              className="inline-flex items-center gap-1.5 text-sm text-slate-400"
                            >
                              <IconCalendar className="h-3.5 w-3.5" />
                              {formatDate(featured.publicadoEm)}
                            </time>
                          )}
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 group-hover:text-brand-700 transition-colors">
                            Leia mais
                            <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              )}

              {/* Grid das demais notícias */}
              {rest.length > 0 && (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                  {rest.map((noticia) => (
                    <StaggerItem key={noticia.id}>
                      <NoticiaCard noticia={noticia} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <FadeIn delay={0.3}>
                  <div className="mt-12 flex flex-col items-center gap-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      baseUrl="/noticias"
                    />
                    <p className="text-sm text-slate-400">
                      Página {currentPage} de {totalPages}
                    </p>
                  </div>
                </FadeIn>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}

// ── Card de notícia ──────────────────────────────────────────────────────────

interface NoticiaData {
  id: string
  titulo: string
  slug: string
  corpo: string
  tags: string[]
  imagemUrl: string | null
  publicadoEm: Date | null
}

function NoticiaCard({ noticia }: { noticia: NoticiaData }) {
  return (
    <Link
      href={`/noticias/${noticia.slug}`}
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden">
        {noticia.imagemUrl ? (
          <Image
            src={noticia.imagemUrl}
            alt={noticia.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center">
            <IconNews className="h-12 w-12 text-white/30" />
          </div>
        )}
        {/* Overlay gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>

      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {noticia.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {noticia.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
          {noticia.titulo}
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1 line-clamp-3">
          {truncateText(noticia.corpo, 150)}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          {noticia.publicadoEm && (
            <time
              dateTime={noticia.publicadoEm.toISOString()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400"
            >
              <IconCalendar className="h-3.5 w-3.5" />
              {formatDate(noticia.publicadoEm)}
            </time>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700 transition-colors">
            Leia mais
            <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}
