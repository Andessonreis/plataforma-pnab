import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@server/lib/db'
import { auth } from '@server/lib/auth'
import { notFound } from 'next/navigation'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconClipboard } from '@client/components/ui'
import { formatDate } from '@shared/utils/format'

export const metadata: Metadata = {
  title: 'Recursos — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    fase?: string
    status?: string
    editalId?: string
    search?: string
  }>
}

const FASES: { value: string; label: string }[] = [
  { value: 'HABILITACAO', label: 'Habilitação' },
  { value: 'RESULTADO_PRELIMINAR', label: 'Resultado Preliminar' },
  { value: 'RESULTADO_FINAL', label: 'Resultado Final' },
]

function formatFase(fase: string): string {
  return FASES.find((f) => f.value === fase)?.label ?? fase
}

type StatusInfo = { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'neutral' }

function statusInfo(
  decisao: string | null,
  decididoPor: string | null,
  respostas: { decisao: string }[],
  totalAvaliadores: number,
): StatusInfo {
  if (decisao) {
    const por = decididoPor === 'ADMIN' ? ' · Secretaria' : decididoPor === 'CONSENSO' ? ' · consenso' : ''
    return decisao === 'DEFERIDO'
      ? { label: `Deferido${por}`, variant: 'success' }
      : { label: `Indeferido${por}`, variant: 'error' }
  }
  if (totalAvaliadores > 0 && respostas.length >= totalAvaliadores) {
    const todasIguais = respostas.every((r) => r.decisao === respostas[0].decisao)
    if (!todasIguais) return { label: 'Divergente — decisão da Secretaria', variant: 'warning' }
    return { label: 'Consenso — a efetivar', variant: 'info' }
  }
  return {
    label: totalAvaliadores > 0
      ? `Aguardando avaliadores (${respostas.length}/${totalAvaliadores})`
      : 'Sem avaliadores atribuídos',
    variant: 'neutral',
  }
}

export default async function AdminRecursosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || !['ADMIN', 'HABILITADOR'].includes(session.user.role)) notFound()

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const faseFilter = params.fase || undefined
  const statusFilter = params.status || undefined
  const editalIdFilter = params.editalId || undefined
  const searchQuery = params.search || undefined

  const where: Record<string, unknown> = {}
  if (faseFilter) where.fase = faseFilter
  if (statusFilter === 'em_analise') where.decisao = null
  if (statusFilter === 'deferido') where.decisao = 'DEFERIDO'
  if (statusFilter === 'indeferido') where.decisao = 'INDEFERIDO'

  const inscricaoWhere: Record<string, unknown> = {}
  if (editalIdFilter) inscricaoWhere.editalId = editalIdFilter
  if (searchQuery) {
    inscricaoWhere.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
    ]
  }
  if (Object.keys(inscricaoWhere).length > 0) where.inscricao = inscricaoWhere

  const [recursos, total, emAnaliseTotal, deferidosTotal, indeferidosTotal, editais] =
    await Promise.all([
      prisma.recurso.findMany({
        where,
        include: {
          inscricao: {
            include: {
              proponente: { select: { nome: true } },
              edital: { select: { titulo: true } },
              _count: { select: { avaliacoes: true } },
            },
          },
          respostas: {
            include: { avaliador: { select: { nome: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recurso.count({ where }),
      prisma.recurso.count({ where: { decisao: null } }),
      prisma.recurso.count({ where: { decisao: 'DEFERIDO' } }),
      prisma.recurso.count({ where: { decisao: 'INDEFERIDO' } }),
      prisma.edital.findMany({
        select: { id: true, titulo: true, ano: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

  const totalPages = Math.ceil(total / pageSize)

  const filterParams = new URLSearchParams()
  if (faseFilter) filterParams.set('fase', faseFilter)
  if (statusFilter) filterParams.set('status', statusFilter)
  if (editalIdFilter) filterParams.set('editalId', editalIdFilter)
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/admin/recursos${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Acompanhe as considerações dos avaliadores. {emAnaliseTotal} em análise · {deferidosTotal} deferido(s) · {indeferidosTotal} indeferido(s)
          </p>
        </div>
      </FadeIn>

      {/* Filtros */}
      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/admin/recursos" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">Buscar</label>
              <input
                id="search" name="search" type="text" defaultValue={searchQuery}
                placeholder="Nome ou número..."
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="editalId" className="block text-sm font-medium text-slate-700 mb-1.5">Edital</label>
              <select
                id="editalId" name="editalId" defaultValue={editalIdFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos</option>
                {editais.map((e) => (
                  <option key={e.id} value={e.id}>{e.titulo} ({e.ano})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fase" className="block text-sm font-medium text-slate-700 mb-1.5">Fase</label>
              <select
                id="fase" name="fase" defaultValue={faseFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todas</option>
                {FASES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                id="status" name="status" defaultValue={statusFilter}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
              >
                <option value="">Todos</option>
                <option value="em_analise">Em análise</option>
                <option value="deferido">Deferido</option>
                <option value="indeferido">Indeferido</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Filtrar</Button>
            <Button href="/admin/recursos" variant="ghost">Limpar</Button>
          </div>
        </form>
      </Card>

      {recursos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso encontrado"
            description="Ajuste os filtros ou aguarde novos recursos."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {recursos.map((r) => {
              const st = statusInfo(r.decisao, r.decididoPor, r.respostas, r.inscricao._count.avaliacoes)
              return (
                <Card key={r.id} padding="sm" className="sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900">{r.inscricao.proponente.nome}</p>
                      <p className="text-xs text-slate-500">{r.inscricao.edital.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono">{r.inscricao.numero}</span>
                        <span>·</span>
                        <Badge variant="neutral">{formatFase(r.fase)}</Badge>
                        <span>·</span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  {/* O que o proponente alegou */}
                  <div className="rounded-lg bg-slate-50 p-3 mb-3">
                    <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">Recurso do proponente</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words line-clamp-4">{r.texto}</p>
                  </div>

                  {/* Considerações dos avaliadores */}
                  {r.respostas.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">Considerações dos avaliadores</p>
                      {r.respostas.map((resp) => (
                        <div key={resp.id} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-900">{resp.avaliador.nome}</span>
                            <Badge variant={resp.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                              {resp.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{resp.justificativa}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Os avaliadores ainda não enviaram suas considerações.</p>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/admin/inscricoes/${r.inscricaoId}`}
                      className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                    >
                      Ver inscrição →
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-4 sm:mt-6" />
        </>
      )}
    </section>
  )
}
