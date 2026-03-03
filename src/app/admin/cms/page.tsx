import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Paginas Institucionais — Portal PNAB Irece',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paginas Institucionais</h1>
          <p className="text-slate-600 mt-1">{total} pagina(s) encontrada(s)</p>
        </div>
        <Link
          href="/admin/cms/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Pagina
        </Link>
      </div>

      {pages.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhuma pagina</h2>
            <p className="text-slate-500 mt-1">Crie a primeira pagina institucional.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Titulo</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Slug</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Atualizada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Acoes</th>
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
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
