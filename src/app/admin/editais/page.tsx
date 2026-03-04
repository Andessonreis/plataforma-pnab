import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconNews } from '@/components/ui'
import { editalStatusLabel, editalStatusVariant } from '@/lib/status-maps'
import type { EditalStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Gestão de Editais — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminEditaisPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const statusFilter = params.status || undefined

  const where = statusFilter ? { status: statusFilter as EditalStatus } : {}

  const [editais, total] = await Promise.all([
    prisma.edital.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { inscricoes: true } },
      },
    }),
    prisma.edital.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const allStatuses: EditalStatus[] = [
    'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Editais</h1>
            <p className="text-slate-600 mt-1">{total} edital(ais) encontrado(s)</p>
          </div>
          <Button href="/admin/editais/novo">
            <IconPlus className="h-4 w-4 mr-2" />
            Novo Edital
          </Button>
        </div>
      </FadeIn>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/editais"
          className={[
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
            !statusFilter
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          ].join(' ')}
        >
          Todos
        </Link>
        {allStatuses.map((status) => (
          <Link
            key={status}
            href={`/admin/editais?status=${status}`}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              statusFilter === status
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {editalStatusLabel[status]}
          </Link>
        ))}
      </div>

      {editais.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconNews className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital"
            description="Crie o primeiro edital para começar."
            action={{ label: 'Novo Edital', href: '/admin/editais/novo' }}
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ano</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categorias</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Valor Total</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Inscrições</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {editais.map((edital) => (
                    <tr key={edital.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{edital.titulo}</p>
                          <p className="text-xs text-slate-500 font-mono">{edital.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{edital.ano}</td>
                      <td className="py-3 px-4">
                        <Badge variant={editalStatusVariant[edital.status as EditalStatus]}>
                          {editalStatusLabel[edital.status as EditalStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {edital.categorias.slice(0, 2).map((cat) => (
                            <Badge key={cat} variant="neutral">{cat}</Badge>
                          ))}
                          {edital.categorias.length > 2 && (
                            <Badge variant="neutral">+{edital.categorias.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {edital.valorTotal
                          ? `R$ ${Number(edital.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {edital._count.inscricoes}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/editais/${edital.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            Editar
                          </Link>
                          <Link
                            href={`/editais/${edital.slug}`}
                            className="text-slate-500 hover:text-slate-700 font-medium text-xs"
                            target="_blank"
                              title={edital.status === 'RASCUNHO' ? 'Pré-visualizar rascunho (visível só para admins)' : 'Ver página pública'}
                            >
                              {edital.status === 'RASCUNHO' ? 'Preview' : 'Ver'}
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
            baseUrl={statusFilter ? `/admin/editais?status=${statusFilter}` : '/admin/editais'}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
