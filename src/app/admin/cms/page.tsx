import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconDocument } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Páginas Institucionais — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminCmsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10

  const [pages, total] = await Promise.all([
    prisma.cmsPage.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cmsPage.count(),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Páginas Institucionais</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{total} página(s)</p>
          </div>
          <Button href="/admin/cms/nova" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Página</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </FadeIn>

      {pages.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconDocument className="h-8 w-8 text-slate-400" />}
            title="Nenhuma página"
            description="Crie a primeira página institucional."
            action={{ label: 'Nova Página', href: '/admin/cms/nova' }}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {pages.map((cmsPage) => (
              <Link
                key={cmsPage.id}
                href={`/admin/cms/${cmsPage.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-slate-900 leading-snug">{cmsPage.titulo}</p>
                  <Badge variant={cmsPage.publicado ? 'success' : 'neutral'}>
                    {cmsPage.publicado ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{cmsPage.slug}</span>
                  <span>{new Date(cmsPage.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: tabela */}
          <Card padding="sm" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Slug</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Atualizada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((cmsPage) => (
                    <tr key={cmsPage.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{cmsPage.titulo}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-500 font-mono">{cmsPage.slug}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={cmsPage.publicado ? 'success' : 'neutral'}>
                          {cmsPage.publicado ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(cmsPage.updatedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/cms/${cmsPage.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            Editar
                          </Link>
                          {cmsPage.publicado && (
                            <Link
                              href={`/pagina/${cmsPage.slug}`}
                              className="text-slate-500 hover:text-slate-700 font-medium text-xs"
                              target="_blank"
                            >
                              Ver
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/admin/cms"
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
