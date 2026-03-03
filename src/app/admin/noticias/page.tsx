import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconNews } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Gestão de Notícias — Portal PNAB Irecê',
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
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Notícias</h1>
            <p className="text-slate-600 mt-1">{total} notícia(s) encontrada(s)</p>
          </div>
          <Button href="/admin/noticias/nova">
            <IconPlus className="h-4 w-4 mr-2" />
            Nova Notícia
          </Button>
        </div>
      </FadeIn>

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
          <EmptyState
            icon={<IconNews className="h-8 w-8 text-slate-400" />}
            title="Nenhuma notícia"
            description="Crie a primeira notícia para começar."
            action={{ label: 'Nova Notícia', href: '/admin/noticias/nova' }}
          />
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Data Publicação</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
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
