import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '../require-role'
import { prisma } from '@/lib/db'
import {
  Card,
  Badge,
  Pagination,
  EmptyState,
  FadeIn,
  IconShield,
  IconClipboard,
  IconCheck,
  IconClose,
  IconSearch,
  IconArrowLeft,
} from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { EditalPicker, type EditalHabilitacaoCard } from './edital-picker'
import type { InscricaoStatus, EditalStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Habilitação — Portal PNAB Irecê',
}

const ABAS = {
  pendentes: {
    status: 'ENVIADA' as InscricaoStatus,
    label: 'Aguardando conferência',
  },
  habilitadas: {
    status: 'HABILITADA' as InscricaoStatus,
    label: 'Habilitadas',
  },
  inabilitadas: {
    status: 'INABILITADA' as InscricaoStatus,
    label: 'Inabilitadas',
  },
} as const

type AbaKey = keyof typeof ABAS

/** Editais que alcançaram (ou já passaram por) a fase de habilitação. */
const EDITAL_STATUS_COM_HABILITACAO: EditalStatus[] = [
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

const STATUS_HABILITACAO: InscricaoStatus[] = ['ENVIADA', 'HABILITADA', 'INABILITADA']

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
  const editalIdFilter = params.editalId || undefined

  // Sem edital escolhido → tela de seleção (com auto-skip quando há só um).
  if (!editalIdFilter) {
    return renderPicker()
  }

  const abaParam = (params.aba ?? 'pendentes') as AbaKey
  const abaAtiva: AbaKey = abaParam in ABAS ? abaParam : 'pendentes'
  const statusFiltro = ABAS[abaAtiva].status

  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const searchQuery = params.search?.trim() || undefined

  const edital = await prisma.edital.findUnique({
    where: { id: editalIdFilter },
    select: { id: true, titulo: true, ano: true, status: true },
  })
  if (!edital) redirect('/admin/habilitacao')

  const where: Record<string, unknown> = { status: statusFiltro, editalId: edital.id }
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
      { proponente: { cpfCnpj: { contains: searchQuery } } },
    ]
  }

  const [inscricoes, total, contagens, totalEditais] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        proponente: { select: { nome: true, cpfCnpj: true } },
        _count: { select: { anexos: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.groupBy({
      by: ['status'],
      where: { editalId: edital.id, status: { in: STATUS_HABILITACAO } },
      _count: { _all: true },
    }),
    prisma.edital.count({ where: { status: { in: EDITAL_STATUS_COM_HABILITACAO } } }),
  ])

  const countMap = Object.fromEntries(contagens.map((c) => [c.status, c._count._all]))
  const totalPendentes = countMap['ENVIADA'] ?? 0
  const totalHabilitadas = countMap['HABILITADA'] ?? 0
  const totalInabilitadas = countMap['INABILITADA'] ?? 0

  const totalPages = Math.ceil(total / pageSize)
  const ativo = edital.status === 'HABILITACAO'
  const podeTrocarEdital = totalEditais > 1

  function hrefAba(aba: AbaKey) {
    const sp = new URLSearchParams()
    sp.set('editalId', edital!.id)
    sp.set('aba', aba)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/habilitacao?${sp.toString()}`
  }

  const baseUrl = (() => {
    const sp = new URLSearchParams()
    sp.set('editalId', edital.id)
    sp.set('aba', abaAtiva)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/habilitacao?${sp.toString()}`
  })()

  const abasCount: Record<AbaKey, number> = {
    pendentes: totalPendentes,
    habilitadas: totalHabilitadas,
    inabilitadas: totalInabilitadas,
  }

  function detalheHref(inscricaoId: string) {
    const sp = new URLSearchParams()
    sp.set('editalId', edital!.id)
    sp.set('aba', abaAtiva)
    return `/admin/habilitacao/${inscricaoId}?${sp.toString()}`
  }

  return (
    <section>
      <FadeIn>
        {/* Cabeçalho institucional — escopado no edital escolhido */}
        <header className="mb-6 sm:mb-8">
          {podeTrocarEdital && (
            <Link
              href="/admin/habilitacao"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
            >
              <IconArrowLeft className="h-4 w-4" />
              Trocar edital
            </Link>
          )}

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
              <IconShield className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {edital.titulo}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Edição {edital.ano} <span className="text-slate-400">·</span> Habilitação documental
              </p>
            </div>
          </div>

          {/* Status da etapa */}
          {ativo ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <p className="text-sm text-emerald-900">
                <strong className="font-semibold">Fase de habilitação aberta</strong> — confira a
                documentação enviada e registre o resultado.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <svg className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-600">
                A fase de habilitação deste edital já foi encerrada. As inscrições abaixo refletem o
                histórico da conferência.
              </p>
            </div>
          )}
        </header>
      </FadeIn>

      {/* Barra de status — tabs com contagens integradas */}
      <div className="mb-5 sm:mb-6 border-b border-slate-200">
        <nav className="flex flex-wrap gap-x-1 -mb-px" aria-label="Filtrar por status de habilitação">
          {(Object.keys(ABAS) as AbaKey[]).map((aba) => {
            const isActive = aba === abaAtiva
            const count = abasCount[aba]
            return (
              <Link
                key={aba}
                href={hrefAba(aba)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px]',
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300',
                ].join(' ')}
              >
                <span>{ABAS[aba].label}</span>
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-semibold tabular-nums',
                    isActive
                      ? aba === 'pendentes' && count > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-brand-100 text-brand-800'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {count}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Busca — o edital já está fixado pela escolha na tela anterior */}
      {(total > 0 || searchQuery) && (
        <form method="get" action="/admin/habilitacao" className="mb-5 sm:mb-6">
          <input type="hidden" name="editalId" value={edital.id} />
          <input type="hidden" name="aba" value={abaAtiva} />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="Buscar por nome, CPF/CNPJ ou número da inscrição"
                aria-label="Buscar inscrições"
                className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
              >
                Buscar
              </button>
              {searchQuery && (
                <Link
                  href={`/admin/habilitacao?editalId=${edital.id}&aba=${abaAtiva}`}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                >
                  Limpar
                </Link>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Conteúdo principal */}
      {inscricoes.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={
              abaAtiva === 'pendentes' ? (
                <IconClipboard className="h-8 w-8 text-slate-400" />
              ) : abaAtiva === 'habilitadas' ? (
                <IconCheck className="h-8 w-8 text-slate-400" />
              ) : (
                <IconClose className="h-8 w-8 text-slate-400" />
              )
            }
            title={
              abaAtiva === 'pendentes'
                ? ativo
                  ? 'Nada para conferir no momento'
                  : 'Sem inscrições pendentes'
                : abaAtiva === 'habilitadas'
                ? 'Nenhuma inscrição habilitada ainda'
                : 'Nenhuma inscrição inabilitada'
            }
            description={
              abaAtiva === 'pendentes'
                ? 'Quando novas inscrições forem enviadas e a fase estiver aberta, elas aparecerão aqui.'
                : 'Ajuste os filtros acima ou troque de aba para ver outras inscrições.'
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile: lista de cards */}
          <ul className="sm:hidden space-y-3" aria-label="Inscrições">
            {inscricoes.map((inscricao) => (
              <li key={inscricao.id}>
                <Link
                  href={detalheHref(inscricao.id)}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {inscricao.proponente.nome}
                    </p>
                    <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                      {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{inscricao.numero}</span>
                    <div className="flex items-center gap-3">
                      <span>
                        {inscricao._count.anexos} {inscricao._count.anexos === 1 ? 'doc.' : 'docs.'}
                      </span>
                      <span>
                        {inscricao.submittedAt
                          ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Número</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Proponente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Docs.</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Enviada em</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((inscricao) => (
                  <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{inscricao.numero}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{inscricao.proponente.cpfCnpj}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 tabular-nums">{inscricao._count.anexos}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inscricao.submittedAt
                        ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={detalheHref(inscricao.id)}
                        className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium text-sm"
                      >
                        {abaAtiva === 'pendentes' ? 'Conferir documentos' : 'Ver detalhes'}
                        <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-5 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}

/** Tela de seleção de edital. Redireciona direto quando há só um. */
async function renderPicker() {
  const editais = await prisma.edital.findMany({
    where: { status: { in: EDITAL_STATUS_COM_HABILITACAO } },
    select: { id: true, titulo: true, ano: true, status: true },
  })

  const contagens = editais.length
    ? await prisma.inscricao.groupBy({
        by: ['editalId', 'status'],
        where: {
          editalId: { in: editais.map((e) => e.id) },
          status: { in: STATUS_HABILITACAO },
        },
        _count: { _all: true },
      })
    : []

  const tally = new Map<string, { pendentes: number; habilitadas: number; inabilitadas: number }>()
  for (const e of editais) tally.set(e.id, { pendentes: 0, habilitadas: 0, inabilitadas: 0 })
  for (const c of contagens) {
    const t = tally.get(c.editalId)
    if (!t) continue
    const n = c._count._all
    if (c.status === 'ENVIADA') t.pendentes += n
    else if (c.status === 'HABILITADA') t.habilitadas += n
    else if (c.status === 'INABILITADA') t.inabilitadas += n
  }

  // Editais na fase ativa sempre aparecem; encerrados só quando têm histórico.
  const cards: EditalHabilitacaoCard[] = editais
    .map((e) => ({ ...e, ...tally.get(e.id)! }))
    .filter((c) => c.status === 'HABILITACAO' || c.pendentes + c.habilitadas + c.inabilitadas > 0)
    .sort((a, b) => {
      const ativoA = a.status === 'HABILITACAO' ? 0 : 1
      const ativoB = b.status === 'HABILITACAO' ? 0 : 1
      if (ativoA !== ativoB) return ativoA - ativoB
      return b.ano - a.ano
    })

  if (cards.length === 0) {
    return (
      <section>
        <FadeIn>
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
                <IconShield className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Habilitação documental
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                  Confira a documentação enviada pelos proponentes e registre o resultado da etapa de habilitação.
                </p>
              </div>
            </div>
          </header>
        </FadeIn>
        <Card padding="md">
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital em habilitação"
            description="Quando um edital entrar na fase de habilitação, ele aparecerá aqui para conferência."
          />
        </Card>
      </section>
    )
  }

  if (cards.length === 1) {
    redirect(`/admin/habilitacao?editalId=${cards[0].id}`)
  }

  return <EditalPicker editais={cards} />
}
