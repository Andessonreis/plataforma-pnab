import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui'
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

export default async function ExportPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams
  const editalId = params.editalId || undefined
  const statusFilter = params.status as InscricaoStatus | undefined

  const where: Record<string, unknown> = {}
  if (editalId) where.editalId = editalId
  if (statusFilter) where.status = statusFilter

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

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 text-xs text-slate-400" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-slate-600 transition-colors">Painel</Link>
        <span>/</span>
        <Link href="/admin/inscricoes" className="hover:text-slate-600 transition-colors">Inscrições</Link>
        <span>/</span>
        <span className="text-slate-600">Exportar</span>
      </nav>

      {/* ── Título + botão ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Exportação de Inscrições</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Filtre os dados e baixe o CSV para usar em planilha.
          </p>
        </div>
        <Suspense fallback={null}>
          <ExportButton total={total} />
        </Suspense>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Filtros</p>
        <Suspense fallback={null}>
          <FilterForm
            editais={editais}
            selectedEditalId={editalId}
            selectedStatus={statusFilter}
          />
        </Suspense>
      </div>

      {/* ── Números ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Total</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{total.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Contempladas</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{countContempladas}</p>
          {total > 0 && (
            <p className="text-xs text-slate-400">{Math.round((countContempladas / total) * 100)}%</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Habilitadas</p>
          <p className="text-2xl font-bold text-slate-700 tabular-nums">{countHabilitadas}</p>
          <p className="text-xs text-red-400">{countInabilitadas} inabilitada{countInabilitadas !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Não contempladas</p>
          <p className="text-2xl font-bold text-red-500 tabular-nums">{countNaoContempladas}</p>
        </div>
      </div>

      {/* ── Prévia ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Prévia ({total > PREVIEW_LIMIT ? `${PREVIEW_LIMIT} de ${total.toLocaleString('pt-BR')}` : total})
        </p>

        {total === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhuma inscrição encontrada.</p>
            <p className="mt-1 text-xs text-slate-400">Ajuste os filtros acima.</p>
          </div>
        ) : (
          <>
            {/* Cards — mobile */}
            <div className="sm:hidden space-y-2">
              {preview.map((i) => (
                <div key={i.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{i.proponente.nome}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{i.proponente.email}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={inscricaoStatusVariant[i.status]}>
                        {inscricaoStatusLabel[i.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <span className="font-mono text-slate-400">#{i.numero}</span>
                    {i.proponente.cpfCnpj && (
                      <span className="font-mono">{i.proponente.cpfCnpj}</span>
                    )}
                    {!editalId && (
                      <span className="truncate max-w-[200px] text-slate-400">{i.edital.titulo}</span>
                    )}
                    {i.submittedAt && (
                      <span>{new Date(i.submittedAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              ))}
              {total > PREVIEW_LIMIT && (
                <p className="text-center text-xs text-slate-400 py-2">
                  + {(total - PREVIEW_LIMIT).toLocaleString('pt-BR')} não exibidas — incluídas no CSV
                </p>
              )}
            </div>

            {/* Tabela — sm+ */}
            <div className="hidden sm:block rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[80px]">#</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proponente</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">CPF/CNPJ</th>
                      {!editalId && (
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Edital</th>
                      )}
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Nota</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Enviada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{i.numero}</td>
                        <td className="px-3 py-3 max-w-[200px]">
                          <p className="font-medium text-slate-800 truncate text-sm">{i.proponente.nome}</p>
                          <p className="text-xs text-slate-400 truncate">{i.proponente.email}</p>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {i.proponente.cpfCnpj ?? '—'}
                        </td>
                        {!editalId && (
                          <td className="px-3 py-3 max-w-[160px] hidden md:table-cell">
                            <span className="text-xs text-slate-600 truncate block">{i.edital.titulo}</span>
                          </td>
                        )}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Badge variant={inscricaoStatusVariant[i.status]}>
                            {inscricaoStatusLabel[i.status]}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-slate-600 tabular-nums hidden lg:table-cell">
                          {i.notaFinal ? Number(i.notaFinal).toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell">
                          {i.submittedAt ? new Date(i.submittedAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > PREVIEW_LIMIT && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                  <span className="text-xs text-slate-400">
                    + {(total - PREVIEW_LIMIT).toLocaleString('pt-BR')} não exibidas — incluídas no CSV
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
