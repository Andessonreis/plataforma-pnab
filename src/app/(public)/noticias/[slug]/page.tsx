import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'

interface NoticiaPageProps {
  params: Promise<{ slug: string }>
}

function formatDate(date: Date): string {
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

export async function generateMetadata({ params }: NoticiaPageProps): Promise<Metadata> {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
    select: { titulo: true, corpo: true, imagemUrl: true },
  })

  if (!noticia) {
    return { title: 'Noticia nao encontrada' }
  }

  return {
    title: `${noticia.titulo} — Portal PNAB Irece`,
    description: truncateText(noticia.corpo.replace(/[#*_`]/g, ''), 160),
    openGraph: {
      title: noticia.titulo,
      description: truncateText(noticia.corpo.replace(/[#*_`]/g, ''), 160),
      images: noticia.imagemUrl ? [{ url: noticia.imagemUrl }] : [],
    },
  }
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const { slug } = await params

  const noticia = await prisma.noticia.findUnique({
    where: { slug },
  })

  if (!noticia || !noticia.publicado || !noticia.publicadoEm) {
    notFound()
  }

  // Noticias relacionadas (3 mais recentes, excluindo a atual)
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
              <li>
                <Link href="/noticias" className="hover:text-white transition-colors">
                  Noticias
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium truncate max-w-xs">
                {noticia.titulo}
              </li>
            </ol>
          </nav>

          {/* Tags */}
          {noticia.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {noticia.tags.map((tag) => (
                <Badge key={tag} variant="warning" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-4xl">
            {noticia.titulo}
          </h1>

          <time
            dateTime={noticia.publicadoEm.toISOString()}
            className="mt-4 block text-brand-200"
          >
            Publicado em {formatDate(noticia.publicadoEm)}
          </time>
        </div>
      </section>

      {/* Artigo */}
      <article className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Imagem de destaque */}
          {noticia.imagemUrl && (
            <div className="mb-10 -mt-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src={noticia.imagemUrl}
                alt={noticia.titulo}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Corpo do artigo */}
          <div className="prose prose-slate prose-lg max-w-none">
            {noticia.corpo.split('\n').map((paragraph, i) => {
              const trimmed = paragraph.trim()
              if (!trimmed) return null

              // Detecta headers markdown basicos
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

              return (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">
                  {trimmed}
                </p>
              )
            })}
          </div>

          {/* Voltar */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link
              href="/noticias"
              className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Voltar para Noticias
            </Link>
          </div>
        </div>
      </article>

      {/* Noticias Relacionadas */}
      {related.length > 0 && (
        <section className="bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Outras Noticias
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/noticias/${item.slug}`}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Imagem ou placeholder */}
                  <div className="relative h-40 overflow-hidden">
                    {item.imagemUrl ? (
                      <img
                        src={item.imagemUrl}
                        alt={item.titulo}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 flex items-center justify-center">
                        <svg className="h-10 w-10 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                      {item.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">
                      {truncateText(item.corpo.replace(/[#*_`]/g, ''), 100)}
                    </p>
                    {item.publicadoEm && (
                      <time
                        dateTime={item.publicadoEm.toISOString()}
                        className="mt-3 block text-xs text-slate-400"
                      >
                        {formatDateShort(item.publicadoEm)}
                      </time>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
