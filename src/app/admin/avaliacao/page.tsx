import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '../require-role'
import { prisma } from '@server/lib/db'
import {
  Card,
  Badge,
  Pagination,
  EmptyState,
  FadeIn,
  IconStar,
  IconClipboard,
  IconCheck,
  IconUsers,
  IconSearch,
} from '@client/components/ui'
import { viewNotaTotal } from '@/lib/services/avaliacao-view'
import {
  whereBucket,
  classificarInscricao,
  EDITAL_STATUS_COM_AVALIACAO,
  STATUS_EM_PROCESSO_AVALIACAO,
  STATUS_RESULTADO_PUBLICADO,
  type BucketAvaliacao,
} from '@/lib/services/avaliacao-buckets'
import { EditalPicker, type EditalAvaliacaoCard } from './edital-picker'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Avaliação — Portal PNAB Irecê',
}

const ABAS = {
  aguardando: { label: 'Aguardando avaliadores' },
  em_avaliacao: { label: 'Em avaliação' },
  avaliadas: { label: 'Avaliadas' },
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

export default async function AdminAvaliacaoPage({ searchParams }: Props) {
  await requireRole('ADMIN')

  const params = await searchParams
  const editalIdFilter = params.editalId || undefined

  // Sem edital escolhido → tela de seleção (com auto-skip quando há só um).
  if (!editalIdFilter) {
    return renderPicker()
  }

  const abaParam = (params.aba ?? 'aguardando') as AbaKey
  const abaAtiva: AbaKey = abaParam in ABAS ? abaParam : 'aguardando'
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const searchQuery = params.search?.trim() || undefined

  const edital = await prisma.edital.findUnique({
    where: { id: editalIdFilter },
    select: { id: true, titulo: true, ano: true, status: true },
  })
  if (!edital) redirect('/admin/avaliacao')

  const editalScope: Prisma.InscricaoWhereInput = { editalId: edital.id }
  const searchScope: Prisma.InscricaoWhereInput | null = searchQuery
    ? {
        OR: [
          { numero: { contains: searchQuery, mode: 'insensitive' } },
          { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
          { proponente: { cpfCnpj: { contains: searchQuery } } },
        ],
      }
    : null

  const where: Prisma.InscricaoWhereInput = {
    AND: [whereBucket(abaAtiva), editalScope, ...(searchScope ? [searchScope] : [])],
  }

  const countWhere = (bucket: BucketAvaliacao): Prisma.InscricaoWhereInput => ({
    AND: [whereBucket(bucket), editalScope],
  })

  const [inscricoes, total, contAguardando, contEmAvaliacao, contAvaliadas, totalEditais] =
    await Promise.all([
      prisma.inscricao.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          edital: { select: { titulo: true, ano: true } },
          proponente: { select: { nome: true, cpfCnpj: true } },
          avaliacoes: { select: { finalizada: true, notaTotal: true } },
        },
      }),
      prisma.inscricao.count({ where }),
      prisma.inscricao.count({ where: countWhere('aguardando') }),
      prisma.inscricao.count({ where: countWhere('em_avaliacao') }),
      prisma.inscricao.count({ where: countWhere('avaliadas') }),
      prisma.edital.count({ where: { status: { in: EDITAL_STATUS_COM_AVALIACAO } } }),
    ])

  const totalPages = Math.ceil(total / pageSize)
  const ativo = edital.status === 'AVALIACAO'
  const podeTrocarEdital = totalEditais > 1

  function hrefAba(aba: AbaKey) {
    const sp = new URLSearchParams()
    sp.set('editalId', edital!.id)
    sp.set('aba', aba)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/avaliacao?${sp.toString()}`
  }

  const baseUrl = (() => {
    const sp = new URLSearchParams()
    sp.set('editalId', edital.id)
    sp.set('aba', abaAtiva)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/avaliacao?${sp.toString()}`
  })()

  const abasCount: Record<AbaKey, number> = {
    aguardando: contAguardando,
    em_avaliacao: contEmAvaliacao,
    avaliadas: contAvaliadas,
  }

  function detalheHref(inscricaoId: string) {
    const sp = new URLSearchParams()
    sp.set('from', 'avaliacao')
    sp.set('editalId', edital!.id)
    sp.set('aba', abaAtiva)
    return `/admin/inscricoes/${inscricaoId}?${sp.toString()}`
  }

  return (
    <section>
      <FadeIn>
        <header className="mb-6 sm:mb-8">
          {podeTrocarEdital && (
            <Link
              href="/admin/avaliacao"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Trocar edital
            </Link>
          )}

          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
              <IconStar className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Avaliação de projetos
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                Acompanhe a distribuição de avaliadores e o andamento das notas em cada inscrição.
              </p>
            </div>
          </div>

          {ativo ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <p className="text-sm text-emerald-900">
                <strong className="font-semibold">Fase de avaliação aberta</strong> em{' '}
                <span className="font-medium">{edital.titulo}</span>.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <svg className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-600">
                A fase de avaliação deste edital não está aberta. As inscrições abaixo refletem o histórico das notas.
              </p>
            </div>
          )}

          {/* Próximo passo — consolidar e publicar o resultado (fluxo já existente) */}
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <IconCheck className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700">
                Concluiu as avaliações?{' '}
                <span className="font-medium text-slate-900">Consolide as notas e publique o resultado.</span>
              </p>
            </div>
            <Link
              href={`/admin/editais/${edital.id}/resultados`}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Consolidar e divulgar resultado
              <span aria-hidden>→</span>
            </Link>
          </div>
        </header>
      </FadeIn>

      {/* Barra de status — tabs com contagens integradas */}
      <div className="mb-5 sm:mb-6 border-b border-slate-200">
        <nav className="flex flex-wrap gap-x-1 -mb-px" aria-label="Filtrar por status de avaliação">
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
                    isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {count}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Busca */}
      {(total > 0 || searchQuery) && (
        <form method="get" action="/admin/avaliacao" className="mb-5 sm:mb-6">
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
                  href={`/admin/avaliacao?editalId=${edital.id}&aba=${abaAtiva}`}
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
              abaAtiva === 'aguardando' ? (
                <IconClipboard className="h-8 w-8 text-slate-400" />
              ) : abaAtiva === 'em_avaliacao' ? (
                <IconUsers className="h-8 w-8 text-slate-400" />
              ) : (
                <IconCheck className="h-8 w-8 text-slate-400" />
              )
            }
            title={
              abaAtiva === 'aguardando'
                ? 'Nenhuma inscrição aguardando avaliadores'
                : abaAtiva === 'em_avaliacao'
                ? 'Nenhuma inscrição em avaliação'
                : 'Nenhuma inscrição avaliada ainda'
            }
            description="Troque de aba ou ajuste a busca para ver outras inscrições."
          />
        </Card>
      ) : (
        <>
          {/* Mobile: lista de cards */}
          <ul className="sm:hidden space-y-3" aria-label="Inscrições">
            {inscricoes.map((inscricao) => {
              const { atribuidos, finalizadas, media } = resumoAvaliacoes(inscricao.avaliacoes)
              return (
                <li key={inscricao.id}>
                  <Link
                    href={detalheHref(inscricao.id)}
                    className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                      {inscricao.proponente.nome}
                    </p>
                    <p className="text-xs text-slate-500 leading-snug line-clamp-1 mb-2">
                      {inscricao.edital.titulo} ({inscricao.edital.ano})
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">{inscricao.numero}</span>
                      <div className="flex items-center gap-3">
                        <span>{finalizadas}/{atribuidos} avaliações</span>
                        <span className="font-semibold text-brand-700">
                          {media === null ? '—' : `méd. ${media}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Número</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Proponente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Avaliações</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Nota média</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((inscricao) => {
                  const { atribuidos, finalizadas, media } = resumoAvaliacoes(inscricao.avaliacoes)
                  const completo = atribuidos > 0 && finalizadas === atribuidos
                  return (
                    <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{inscricao.numero}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{inscricao.proponente.cpfCnpj}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {atribuidos === 0 ? (
                          <span className="text-slate-400 text-xs">Sem avaliadores</span>
                        ) : (
                          <Badge variant={completo ? 'success' : 'warning'}>
                            {finalizadas}/{atribuidos} finalizadas
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brand-700 tabular-nums">
                        {media === null ? <span className="text-slate-400 font-normal">—</span> : media}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={detalheHref(inscricao.id)}
                          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium text-sm"
                        >
                          Ver detalhes
                          <span aria-hidden>→</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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

/** Tela de seleção de edital. Redireciona direto quando há um único edital. */
async function renderPicker() {
  const editais = await prisma.edital.findMany({
    where: { status: { in: EDITAL_STATUS_COM_AVALIACAO } },
    select: { id: true, titulo: true, ano: true, status: true },
  })

  const inscricoes = editais.length
    ? await prisma.inscricao.findMany({
        where: {
          editalId: { in: editais.map((e) => e.id) },
          status: { in: [...STATUS_EM_PROCESSO_AVALIACAO, ...STATUS_RESULTADO_PUBLICADO] },
        },
        select: { editalId: true, status: true, avaliacoes: { select: { finalizada: true } } },
      })
    : []

  const tally = new Map<string, { aguardando: number; emAvaliacao: number; avaliadas: number }>()
  for (const e of editais) tally.set(e.id, { aguardando: 0, emAvaliacao: 0, avaliadas: 0 })
  for (const insc of inscricoes) {
    const t = tally.get(insc.editalId)
    if (!t) continue
    const bucket = classificarInscricao(insc.status, insc.avaliacoes)
    if (bucket === 'aguardando') t.aguardando++
    else if (bucket === 'em_avaliacao') t.emAvaliacao++
    else t.avaliadas++
  }

  // Editais ativos sempre aparecem; concluídos só quando têm inscrições avaliadas.
  const cards: EditalAvaliacaoCard[] = editais
    .map((e) => ({ ...e, ...tally.get(e.id)! }))
    .filter((c) => c.status === 'AVALIACAO' || c.aguardando + c.emAvaliacao + c.avaliadas > 0)
    .sort((a, b) => {
      const ativoA = a.status === 'AVALIACAO' ? 0 : 1
      const ativoB = b.status === 'AVALIACAO' ? 0 : 1
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
                <IconStar className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Avaliação de projetos
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                  Acompanhe a distribuição de avaliadores e o andamento das notas em cada inscrição.
                </p>
              </div>
            </div>
          </header>
        </FadeIn>
        <Card padding="md">
          <EmptyState
            icon={<IconStar className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital em avaliação"
            description="Quando um edital entrar na fase de avaliação, ele aparecerá aqui para acompanhamento das notas."
          />
        </Card>
      </section>
    )
  }

  if (cards.length === 1) {
    redirect(`/admin/avaliacao?editalId=${cards[0].id}`)
  }

  return <EditalPicker editais={cards} />
}

/** Resumo das avaliações de uma inscrição: atribuídos, finalizadas e nota média (só finalizadas). */
function resumoAvaliacoes(avaliacoes: { finalizada: boolean; notaTotal: unknown }[]) {
  const atribuidos = avaliacoes.length
  const finalizadas = avaliacoes.filter((a) => a.finalizada).length
  const notas = avaliacoes
    .map((a) => viewNotaTotal(a))
    .filter((n): n is number => n !== null)
  const media =
    notas.length > 0
      ? (notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(2)
      : null
  return { atribuidos, finalizadas, media }
}
