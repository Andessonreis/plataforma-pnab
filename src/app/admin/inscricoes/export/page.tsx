import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, StatCard } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import ExportButton from './export-button'
import FilterForm from './filter-form'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Exportar Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    editalId?: string
    status?: string
  }>
}

const PREVIEW_LIMIT = 20

function IconDownload() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function IconDoc() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
}

export default async function ExportPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams
  const editalId = params.editalId || undefined
  const statusFilter = params.status as InscricaoStatus | undefined

  const where: Record<string, unknown> = {}
  if (editalId) where.editalId = editalId
  if (statusFilter) where.status = statusFilter

  // Busca paralela: editais, contagem total, inscrições da preview e contagens por grupo
  const [editais, total, preview, countContempladas, countNaoContempladas, countHabilitadas, countInabilitadas] =
    await Promise.all([
      prisma.edital.findMany({ select: { id: true, titulo: true, ano: true }, orderBy: { createdAt: 'desc' } }),
      prisma.inscricao.count({ where }),
      prisma.inscricao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: PREVIEW_LIMIT,
        include: {
          edital: { select: { titulo: true } },
          proponente: { select: { nome: true, cpfCnpj: true, email: true } },
        },
      }),
      prisma.inscricao.count({ where: { ...where, status: 'CONTEMPLADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'NAO_CONTEMPLADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'HABILITADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'INABILITADA' } }),
    ])

  // Monta a URL de download para a API
  const apiParams = new URLSearchParams()
  if (editalId) apiParams.set('editalId', editalId)
  if (statusFilter) apiParams.set('status', statusFilter)
  const downloadHref = `/api/admin/inscricoes/export?${apiParams.toString()}`

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <nav className="text-xs text-slate-400 mb-1" aria-label="Breadcrumb">
          <Link href="/admin" className="hover:text-slate-600">Painel</Link>
          {' / '}
          <Link href="/admin/inscricoes" className="hover:text-slate-600">Inscrições</Link>
          {' / '}
          <span className="text-slate-600">Exportação</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Exportação de Inscrições</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filtre os dados e baixe o CSV para análise em planilha. O arquivo inclui: número, proponente, CPF/CNPJ,
          e-mail, edital, status, categoria, nota final e data de envio.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Filtros</h2>
          <Suspense fallback={null}>
            <FilterForm
              editais={editais}
              selectedEditalId={editalId}
              selectedStatus={statusFilter}
            />
          </Suspense>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IconDoc />}
          label="Total filtrado"
          value={total}
          color="bg-brand-50"
          iconColor="text-brand-600"
        />
        <StatCard
          icon={<IconCheck />}
          label="Contempladas"
          value={countContempladas}
          sub={total > 0 ? `${Math.round((countContempladas / total) * 100)}%` : undefined}
          color="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={<IconX />}
          label="Não contempladas"
          value={countNaoContempladas}
          color="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard
          icon={<IconCheck />}
          label="Habilitadas"
          value={countHabilitadas}
          sub={`${countInabilitadas} inabilitada(s)`}
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Preview + Ação de exportação */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Prévia dos dados</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {total === 0
                  ? 'Nenhuma inscrição encontrada para os filtros selecionados.'
                  : total > PREVIEW_LIMIT
                  ? `Exibindo ${PREVIEW_LIMIT} de ${total} registros. O CSV conterá todos os ${total}.`
                  : `${total} registro(s) encontrado(s).`}
              </p>
            </div>
            <ExportButton href={downloadHref} total={total} />
          </div>

          {total === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
              <IconDoc />
              <p className="mt-2 text-sm text-slate-500">Nenhum dado para exportar com os filtros atuais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Nº</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Proponente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">CPF/CNPJ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Edital</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Nota Final</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Enviada em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{i.numero}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 truncate max-w-[160px]">{i.proponente.nome}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{i.proponente.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">
                        {i.proponente.cpfCnpj ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        <span className="truncate max-w-[200px] block">{i.edital.titulo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={inscricaoStatusVariant[i.status]}>
                          {inscricaoStatusLabel[i.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell">
                        {i.notaFinal ? Number(i.notaFinal).toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell">
                        {i.submittedAt
                          ? new Date(i.submittedAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > PREVIEW_LIMIT && (
            <p className="mt-4 text-xs text-slate-400 text-right">
              + {total - PREVIEW_LIMIT} registros não exibidos — incluídos no CSV.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
