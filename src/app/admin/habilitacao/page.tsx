import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '../require-role'
import { prisma } from '@/lib/db'
import {
  Card,
  Badge,
  Pagination,
  EmptyState,
  FadeIn,
  FilterTabs,
  StatCard,
  IconClipboard,
  IconCheck,
  IconClose,
  IconShield,
} from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Habilitação — Portal PNAB Irecê',
}

const ABAS = {
  pendentes: 'ENVIADA',
  habilitadas: 'HABILITADA',
  inabilitadas: 'INABILITADA',
} as const

type AbaKey = keyof typeof ABAS

interface Props {
  searchParams: Promise<{
    aba?: string
    page?: string
    editalId?: string
    search?: string
  }>
}

export default async function AdminHabilitacaoPage({ searchParams }: Props) {
  await requireRole('ADMIN')

  const params = await searchParams
  const abaParam = (params.aba ?? 'pendentes') as AbaKey
  const abaAtiva: AbaKey = abaParam in ABAS ? abaParam : 'pendentes'
  const statusFiltro: InscricaoStatus = ABAS[abaAtiva]

  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const editalIdFilter = params.editalId || undefined
  const searchQuery = params.search?.trim() || undefined

  const where: Record<string, unknown> = { status: statusFiltro }
  if (editalIdFilter) where.editalId = editalIdFilter
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
      { proponente: { cpfCnpj: { contains: searchQuery } } },
    ]
  }

  const [inscricoes, total, contagens, editais] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { titulo: true, ano: true } },
        proponente: { select: { nome: true, cpfCnpj: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.groupBy({
      by: ['status'],
      where: { status: { in: Object.values(ABAS) as InscricaoStatus[] } },
      _count: { _all: true },
    }),
    prisma.edital.findMany({
      select: { id: true, titulo: true, ano: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const countMap = Object.fromEntries(contagens.map((c) => [c.status, c._count._all]))
  const totalPendentes = countMap['ENVIADA'] ?? 0
  const totalHabilitadas = countMap['HABILITADA'] ?? 0
  const totalInabilitadas = countMap['INABILITADA'] ?? 0

  const totalPages = Math.ceil(total / pageSize)

  function hrefAba(aba: AbaKey) {
    const sp = new URLSearchParams()
    sp.set('aba', aba)
    if (editalIdFilter) sp.set('editalId', editalIdFilter)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/habilitacao?${sp.toString()}`
  }

  const filterParams = new URLSearchParams()
  filterParams.set('aba', abaAtiva)
  if (editalIdFilter) filterParams.set('editalId', editalIdFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/habilitacao?${filterParams.toString()}`

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <IconShield className="h-5 w-5 text-brand-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Habilitação</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Confira a documentação enviada e marque as inscrições como habilitadas ou inabilitadas.
          </p>
        </div>
      </FadeIn>

      {/* Cards-resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Aguardando habilitação"
          value={totalPendentes}
          icon={<IconClipboard className="h-5 w-5" />}
          color="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Habilitadas"
          value={totalHabilitadas}
          icon={<IconCheck className="h-5 w-5" />}
          color="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Inabilitadas"
          value={totalInabilitadas}
          icon={<IconClose className="h-5 w-5" />}
          color="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* Abas */}
      <div className="mb-4 sm:mb-6 overflow-x-auto">
        <FilterTabs
          activeKey={abaAtiva}
          ariaLabel="Filtrar por status de habilitação"
          tabs={[
            { key: 'pendentes', label: `Aguardando (${totalPendentes})`, href: hrefAba('pendentes') },
            { key: 'habilitadas', label: `Habilitadas (${totalHabilitadas})`, href: hrefAba('habilitadas') },
            { key: 'inabilitadas', label: `Inabilitadas (${totalInabilitadas})`, href: hrefAba('inabilitadas') },
          ]}
        />
      </div>

      {/* Filtros */}
      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/admin/habilitacao" className="space-y-4">
          <input type="hidden" name="aba" value={abaAtiva} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">
                Buscar
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="Nome, CPF/CNPJ ou número da inscrição"
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
            >
              Filtrar
            </button>
            <Link
              href={`/admin/habilitacao?aba=${abaAtiva}`}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            >
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title={
              abaAtiva === 'pendentes'
                ? 'Nenhuma inscrição aguardando habilitação'
                : abaAtiva === 'habilitadas'
                ? 'Nenhuma inscrição habilitada ainda'
                : 'Nenhuma inscrição inabilitada'
            }
            description={
              abaAtiva === 'pendentes'
                ? 'Quando os proponentes enviarem inscrições, elas aparecerão aqui para conferência.'
                : 'Ajuste os filtros acima ou troque de aba para ver outras inscrições.'
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {inscricoes.map((inscricao) => (
              <Link
                key={inscricao.id}
                href={`/admin/habilitacao/${inscricao.id}`}
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
                      ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Enviada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.map((inscricao) => (
                    <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{inscricao.numero}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                        <p className="text-xs text-slate-500">{inscricao.proponente.cpfCnpj}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inscricao.edital.titulo}</td>
                      <td className="py-3 px-4">
                        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {inscricao.submittedAt
                          ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/habilitacao/${inscricao.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          {abaAtiva === 'pendentes' ? 'Conferir' : 'Ver detalhes'}
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
