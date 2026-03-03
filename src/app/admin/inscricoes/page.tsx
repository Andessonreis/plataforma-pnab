import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Inscricoes — Portal PNAB Irece',
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

  // Construir filtro
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

  // Construir URL base para paginacao mantendo filtros
  const filterParams = new URLSearchParams()
  if (statusFilter) filterParams.set('status', statusFilter)
  if (editalIdFilter) filterParams.set('editalId', editalIdFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/inscricoes${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inscricoes</h1>
          <p className="text-slate-600 mt-1">{total} inscricao(oes) encontrada(s)</p>
        </div>
        <Link
          href="/api/admin/inscricoes/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </Link>
      </div>

      {/* Filtros */}
      <Card className="mb-6" padding="md">
        <form method="get" action="/admin/inscricoes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">
                Buscar
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="Nome, CPF ou numero..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>

            {/* Edital */}
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

            {/* Status */}
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
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
            >
              Filtrar
            </button>
            <Link
              href="/admin/inscricoes"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center"
            >
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      {inscricoes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhuma inscricao encontrada</h2>
            <p className="text-slate-500 mt-1">Ajuste os filtros ou aguarde novas inscricoes.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Numero</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Proponente</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Enviada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Acoes</th>
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
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
