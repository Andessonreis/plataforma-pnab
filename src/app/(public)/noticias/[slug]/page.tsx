import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge, PageHeader } from '@/components/ui'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconNews,
} from '@/components/ui/icons'
import { formatDate } from '@/lib/utils/format'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface NoticiaPageProps {
  params: Promise<{ slug: string }>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncateText(text: string, maxLength: number): string {
  const clean = text.replace(/[#*_`]/g, '')
  if (clean.length <= maxLength) return clean
  return clean.substring(0, maxLength).trimEnd() + '...'
}

function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: NoticiaPageProps): Promise<Metadata> {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
    select: { titulo: true, corpo: true, imagemUrl: true },
  })

  if (!noticia) {
    return { title: 'Notícia não encontrada' }
  }

  return {
    title: `${noticia.titulo} — Portal PNAB Irecê`,
    description: truncateText(noticia.corpo.replace(/[#*_`]/g, ''), 160),
    openGraph: {
      title: noticia.titulo,
      description: truncateText(noticia.corpo.replace(/[#*_`]/g, ''), 160),
      images: noticia.imagemUrl ? [{ url: noticia.imagemUrl }] : [],
    },
  }
}

// ── Página ───────────────────────────────────────────────────────────────────

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
  })

  if (!noticia || !noticia.publicado || !noticia.publicadoEm) {
    notFound()
  }

  const related = await prisma.noticia.findMany({
    where: {
      publicado: true,
      publicadoEm: { not: null },
      id: { not: noticia.id },
    },
    orderBy: { publicadoEm: 'desc' },
    take: 3,
    select: {
      id: true,
      titulo: true,
      slug: true,
      corpo: true,
      tags: true,
      imagemUrl: true,
      publicadoEm: true,
    },
  })

  const readTime = estimateReadTime(noticia.corpo)

  return (
    <>
      <PageHeader
        title={noticia.titulo}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Notícias', href: '/noticias' },
          { label: noticia.titulo },
        ]}
      >
        {/* Tags + metadata no header */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
          {noticia.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-white"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-brand-200 text-sm">
          <time
            dateTime={noticia.publicadoEm.toISOString()}
            className="inline-flex items-center gap-1.5"
          >
            <IconCalendar className="h-4 w-4" />
            {formatDateLong(noticia.publicadoEm)}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <IconNews className="h-4 w-4" />
            {readTime} min de leitura
          </span>
        </div>
      </PageHeader>

      {/* Artigo */}
      <section className="bg-slate-50 py-6 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Coluna principal (2/3) */}
            <div className="lg:col-span-2">
              <FadeIn delay={0.1}>
                <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Imagem de capa */}
                  {noticia.imagemUrl && (
                    <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                      <Image
                        src={noticia.imagemUrl}
                        alt={noticia.titulo}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    </div>
                  )}

                  {/* Corpo do artigo */}
                  <div className="p-5 sm:p-8 lg:p-10">
                    <div className="prose prose-slate prose-lg max-w-none">
                      {noticia.corpo.split('\n').map((paragraph, i) => {
                        const trimmed = paragraph.trim()
                        if (!trimmed) return null

                        if (trimmed.startsWith('### ')) {
                          return (
                            <h3 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-4">
                              {trimmed.replace('### ', '')}
                            </h3>
                          )
                        }
                        if (trimmed.startsWith('## ')) {
                          return (
                            <h2 key={i} className="text-2xl font-bold text-slate-900 mt-10 mb-4">
                              {trimmed.replace('## ', '')}
                            </h2>
                          )
                        }

                        // Lista simples (linhas que começam com -)
                        if (trimmed.startsWith('- ')) {
                          return (
                            <li key={i} className="text-slate-700 leading-relaxed ml-4 list-disc">
                              {trimmed.replace('- ', '')}
                            </li>
                          )
                        }

                        return (
                          <p key={i} className="text-slate-700 leading-relaxed mb-4">
                            {trimmed}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                </article>
              </FadeIn>

              {/* Voltar */}
              <FadeIn delay={0.2}>
                <div className="mt-8">
                  <Link
                    href="/noticias"
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <IconArrowLeft className="h-4 w-4" />
                    Voltar para Notícias
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Sidebar (1/3) */}
            <aside className="lg:col-span-1">
              <FadeIn delay={0.2} direction="right">
                <div className="sticky top-6 space-y-5 sm:space-y-6">
                  {/* Metadata da notícia */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">
                      Sobre esta notícia
                    </h3>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-slate-500">Publicado em</dt>
                        <dd className="mt-0.5 font-medium text-slate-900">
                          {formatDateLong(noticia.publicadoEm)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Tempo de leitura</dt>
                        <dd className="mt-0.5 font-medium text-slate-900">
                          {readTime} min
                        </dd>
                      </div>
                      {noticia.tags.length > 0 && (
                        <div>
                          <dt className="text-slate-500">Tags</dt>
                          <dd className="mt-1.5 flex flex-wrap gap-1.5">
                            {noticia.tags.map((tag) => (
                              <Badge key={tag} variant="neutral">{tag}</Badge>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* CTA para editais */}
                  <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">
                      Confira os Editais
                    </h3>
                    <p className="text-brand-100 text-sm mb-5 leading-relaxed">
                      Consulte os editais abertos e inscreva seu projeto cultural.
                    </p>
                    <Link
                      href="/editais"
                      className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-md hover:bg-brand-50 transition-colors"
                    >
                      Ver Editais
                      <IconArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Link de volta */}
                  <Link
                    href="/noticias"
                    className="hidden lg:inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <IconArrowLeft className="h-4 w-4" />
                    Todas as notícias
                  </Link>
                </div>
              </FadeIn>
            </aside>
          </div>
        </div>
      </section>

      {/* Notícias Relacionadas */}
      {related.length > 0 && (
        <section className="bg-white py-8 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <p className="section-label text-brand-600 mb-2">Continue lendo</p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Outras Notícias
                  </h2>
                </div>
                <Link
                  href="/noticias"
                  className="hidden sm:inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Ver todas
                  <IconArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
              {related.map((item) => (
                <StaggerItem key={item.id}>
                  <Link
                    href={`/noticias/${item.slug}`}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {item.imagemUrl ? (
                        <Image
                          src={item.imagemUrl}
                          alt={item.titulo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center">
                          <IconNews className="h-10 w-10 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {item.titulo}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">
                        {truncateText(item.corpo.replace(/[#*_`]/g, ''), 100)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {item.publicadoEm && (
                          <time
                            dateTime={item.publicadoEm.toISOString()}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400"
                          >
                            <IconCalendar className="h-3.5 w-3.5" />
                            {formatDateShort(item.publicadoEm)}
                          </time>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700 transition-colors">
                          Ler
                          <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/noticias"
                className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Ver todas as notícias
                <IconArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
