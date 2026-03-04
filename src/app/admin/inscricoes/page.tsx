import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconExport, IconClipboard } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    status?: string
    editalId?: string
    search?: string
  }>
}

export default async function AdminInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const statusFilter = params.status || undefined
  const editalIdFilter = params.editalId || undefined
  const searchQuery = params.search || undefined

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter
  if (editalIdFilter) where.editalId = editalIdFilter
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
      { proponente: { cpfCnpj: { contains: searchQuery } } },
    ]
  }

  const [inscricoes, total, editais] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { titulo: true, slug: true } },
        proponente: { select: { nome: true, cpfCnpj: true, email: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.edital.findMany({
      select: { id: true, titulo: true, ano: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const allStatuses: InscricaoStatus[] = [
    'RASCUNHO', 'ENVIADA', 'HABILITADA', 'INABILITADA', 'EM_AVALIACAO',
    'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL',
    'CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE',
  ]

  const filterParams = new URLSearchParams()
  if (statusFilter) filterParams.set('status', statusFilter)
  if (editalIdFilter) filterParams.set('editalId', editalIdFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/inscricoes${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Inscrições</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{total} inscrição(ões)</p>
          </div>
          <Button href="/admin/inscricoes/export" variant="ghost" size="sm">
            <IconExport className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </FadeIn>

      {/* Filtros */}
      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/admin/inscricoes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">
                Buscar
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="Nome, CPF ou número..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="editalId" className="block text-sm font-medium text-slate-700 mb-1.5">
                Edital
              </label>
              <select
                id="editalId"
                name="editalId"
                defaultValue={editalIdFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos os editais</option>
                {editais.map((edital) => (
                  <option key={edital.id} value={edital.id}>
                    {edital.titulo} ({edital.ano})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos os status</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {inscricaoStatusLabel[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">
              Filtrar
            </Button>
            <Button href="/admin/inscricoes" variant="ghost">
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhuma inscrição encontrada"
            description="Ajuste os filtros ou aguarde novas inscrições."
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {inscricoes.map((inscricao) => (
              <Link
                key={inscricao.id}
                href={`/admin/inscricoes/${inscricao.id}`}
                className="block overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-slate-900 leading-snug">{inscricao.proponente.nome}</p>
                  <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                    {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-snug mb-2 line-clamp-1">{inscricao.edital.titulo}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{inscricao.numero}</span>
                  <span>
                    {inscricao.submittedAt
                      ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Número</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Proponente</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Enviada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.map((inscricao) => (
                    <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{inscricao.numero}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                          <p className="text-xs text-slate-500">{inscricao.proponente.cpfCnpj}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inscricao.edital.titulo}</td>
                      <td className="py-3 px-4 text-slate-600">{inscricao.categoria ?? '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {inscricao.submittedAt
                          ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/inscricoes/${inscricao.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          Detalhes
                        </Link>
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
            baseUrl={baseUrl}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
