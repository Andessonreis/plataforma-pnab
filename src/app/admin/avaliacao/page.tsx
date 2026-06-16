import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '../require-role'
import { prisma } from '@server/lib/db'
import {
  Card,
  Pagination,
  EmptyState,
  FadeIn,
  IconStar,
  IconClipboard,
  IconCheck,
  IconUsers,
} from '@client/components/ui'
import {
  whereBucket,
  classificarInscricao,
  EDITAL_STATUS_COM_AVALIACAO,
  STATUS_EM_PROCESSO_AVALIACAO,
  STATUS_RESULTADO_PUBLICADO,
  type BucketAvaliacao,
} from '@/lib/services/avaliacao-buckets'
import { EditalPicker, type EditalAvaliacaoCard } from './edital-picker'
import { AvaliacaoHeader } from './_components/AvaliacaoHeader'
import { BuscaForm } from './_components/BuscaForm'
import { RankingTable } from './_components/RankingTable'
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

  return (
    <section>
      <AvaliacaoHeader edital={edital} ativo={ativo} podeTrocarEdital={podeTrocarEdital} />

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
      <BuscaForm editalId={edital.id} abaAtiva={abaAtiva} searchQuery={searchQuery} total={total} />

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
          <RankingTable inscricoes={inscricoes} editalId={edital.id} abaAtiva={abaAtiva} />

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
