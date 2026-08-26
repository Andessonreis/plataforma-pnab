import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { InscricaoStatus } from '@prisma/client'
import ExportButton from './export-button'
import FilterForm, { type AreaOption } from './filter-form'
import { categoriaWhere } from '@/lib/inscricoes/area-filter'
import PreviewList from './preview-list'
import ContagemAreas from './contagem-areas'
import EnviarRelatorioButton from './enviar-relatorio-button'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Exportar Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    editalId?: string
    status?: string
    categoria?: string
  }>
}

const PREVIEW_LIMIT = 20

export default async function ExportPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const params = await searchParams
  const editalId = params.editalId || undefined
  const statusFilter = params.status as InscricaoStatus | undefined
  const areaParam = params.categoria || undefined

  // Recorte sem a área — base tanto do <select> quanto do painel de contagem,
  // pra que trocar de área continue mostrando todas as opções disponíveis.
  const whereSemArea: Record<string, unknown> = {}
  if (editalId) whereSemArea.editalId = editalId
  if (statusFilter) whereSemArea.status = statusFilter

  const where: Record<string, unknown> = { ...whereSemArea }
  const recorteArea = categoriaWhere(areaParam)
  if (recorteArea !== undefined) where.categoria = recorteArea

  const [editais, total, preview, countContempladas, countNaoContempladas, countHabilitadas, countInabilitadas, agrupadoPorArea, adminsDestino] =
    await Promise.all([
      prisma.edital.findMany({ select: { id: true, titulo: true, ano: true }, orderBy: { createdAt: 'desc' } }),
      prisma.inscricao.count({ where }),
      prisma.inscricao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: PREVIEW_LIMIT,
        include: {
          edital: { select: { titulo: true } },
          proponente: { select: { nome: true, cpfCnpj: true, email: true, telefone: true } },
        },
      }),
      prisma.inscricao.count({ where: { ...where, status: 'CONTEMPLADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'NAO_CONTEMPLADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'HABILITADA' } }),
      prisma.inscricao.count({ where: { ...where, status: 'INABILITADA' } }),
      prisma.inscricao.groupBy({
        by: ['categoria'],
        where: whereSemArea,
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: { role: 'ADMIN', ativo: true },
        select: { id: true, nome: true, email: true },
        orderBy: { nome: 'asc' },
      }),
    ])

  // Áreas vêm do que existe de fato nas inscrições (não do catálogo), então
  // toda opção do filtro traz resultado e valores fora do padrão ficam visíveis.
  const areas: AreaOption[] = agrupadoPorArea
    .map((g) => ({ nome: g.categoria ?? '', total: g._count._all }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))

  const baseParams = new URLSearchParams()
  if (editalId) baseParams.set('editalId', editalId)
  if (statusFilter) baseParams.set('status', statusFilter)

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Suspense fallback={null}>
            <ExportButton total={total} />
          </Suspense>
          <Suspense fallback={null}>
            <EnviarRelatorioButton
              total={total}
              statusSelecionado={statusFilter}
              destinatarios={adminsDestino}
            />
          </Suspense>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Filtros</p>
        <Suspense fallback={null}>
          <FilterForm
            editais={editais}
            areas={areas}
            selectedEditalId={editalId}
            selectedStatus={statusFilter}
            selectedArea={areaParam}
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

      {/* ── Distribuição por área ─────────────────────────────────── */}
      <ContagemAreas
        areas={areas}
        baseParams={baseParams.toString()}
        selectedArea={areaParam}
      />

      {/* ── Prévia ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Prévia ({total > PREVIEW_LIMIT ? `${PREVIEW_LIMIT} de ${total.toLocaleString('pt-BR')}` : total})
        </p>

        <PreviewList
          items={preview}
          total={total}
          limit={PREVIEW_LIMIT}
          showEdital={!editalId}
        />
      </div>

    </div>
  )
}
