import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Gestao de Noticias — Portal PNAB Irece',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminNoticiasPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const statusFilter = params.status || undefined

  const where = statusFilter === 'publicado'
    ? { publicado: true }
    : statusFilter === 'rascunho'
      ? { publicado: false }
      : {}

  const [noticias, total] = await Promise.all([
    prisma.noticia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.noticia.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'publicado', label: 'Publicadas' },
    { value: 'rascunho', label: 'Rascunhos' },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestao de Noticias</h1>
          <p className="text-slate-600 mt-1">{total} noticia(s) encontrada(s)</p>
        </div>
        <Link
          href="/admin/noticias/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Noticia
        </Link>
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/noticias?status=${opt.value}` : '/admin/noticias'}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              (statusFilter ?? '') === opt.value || (!statusFilter && opt.value === '')
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {noticias.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhuma noticia</h2>
            <p className="text-slate-500 mt-1">Crie a primeira noticia para comecar.</p>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data Publicacao</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {noticias.map((noticia) => (
                    <tr key={noticia.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{noticia.titulo}</p>
                          <p className="text-xs text-slate-500 font-mono">{noticia.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {noticia.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="neutral">{tag}</Badge>
                          ))}
                          {noticia.tags.length > 2 && (
                            <Badge variant="neutral">+{noticia.tags.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={noticia.publicado ? 'success' : 'neutral'}>
                          {noticia.publicado ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {noticia.publicadoEm
                          ? new Date(noticia.publicadoEm).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/noticias/${noticia.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            Editar
                          </Link>
                          <Link
                            href={`/noticias/${noticia.slug}`}
                            className="text-slate-500 hover:text-slate-700 font-medium text-xs"
                            target="_blank"
                          >
                            Ver
                          </Link>
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
            baseUrl={statusFilter ? `/admin/noticias?status=${statusFilter}` : '/admin/noticias'}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
