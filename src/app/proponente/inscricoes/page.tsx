import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Button, Pagination, EmptyState, IconPlus, IconClipboard } from '@/components/ui'
import { STATUS_BUCKETS, resolveBucketKey } from './status-buckets'
import { StatusTabs } from './status-tabs'
import { InscricaoItem } from './inscricao-item'
import { TourButton } from '../tour-button'
import { PASSOS_INSCRICOES } from './inscricoes-tour-steps'

export const metadata: Metadata = {
  title: 'Minhas Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function MinhasInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const userId = session.user.id
  const bucketKey = resolveBucketKey(params.status)
  const bucket = STATUS_BUCKETS[bucketKey]
  const where = {
    proponenteId: userId,
    ...(bucket.statuses ? { status: { in: bucket.statuses } } : {}),
  }

  const [inscricoes, totalFiltrado, totalGeral, contagemBruta] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        numero: true,
        categoria: true,
        status: true,
        submittedAt: true,
        edital: { select: { titulo: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.count({ where: { proponenteId: userId } }),
    prisma.inscricao.groupBy({
      by: ['status'],
      where: { proponenteId: userId },
      _count: { _all: true },
    }),
  ])

  const totalPages = Math.ceil(totalFiltrado / pageSize)
  const contagemPorStatus = new Map(contagemBruta.map((c) => [c.status, c._count._all]))
  const baseUrl = bucketKey === 'todas' ? '/proponente/inscricoes' : `/proponente/inscricoes?status=${bucketKey}`

  return (
    <section>
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <div id="tour-inscricoes-header">
          <h1 className="titulo text-3xl text-tinta-950 sm:text-4xl">Minhas Inscrições</h1>
          <p className="mt-1 text-sm text-tinta-700/70">
            {totalGeral} {totalGeral === 1 ? 'inscrição' : 'inscrições'} no total
          </p>
          <TourButton passos={PASSOS_INSCRICOES} className="mt-3" />
        </div>
        <span id="tour-inscricoes-nova">
          <Button href="/editais" size="sm" className="shrink-0">
            <IconPlus className="mr-1.5 h-4 w-4" />
            Nova
          </Button>
        </span>
      </div>

      {totalGeral > 0 && (
        <div id="tour-inscricoes-filtros">
          <StatusTabs activeKey={bucketKey} contagemPorStatus={contagemPorStatus} totalGeral={totalGeral} />
        </div>
      )}

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-500" />}
            title={totalGeral === 0 ? 'Nenhuma inscrição' : 'Nenhuma inscrição neste filtro'}
            description={
              totalGeral === 0
                ? 'Você ainda não se inscreveu em nenhum edital.'
                : 'Não há inscrições com esse status no momento.'
            }
            action={{ label: 'Ver Editais Abertos', href: '/editais' }}
          />
        </Card>
      ) : (
        <>
          {/* deslop-ignore-next-line 21 22 — borda e radius no mesmo elemento; linhas internas usam divide-y reto, sem raio próprio */}
          <div id="tour-inscricoes-lista" className="overflow-hidden rounded-lg border border-tinta-900/10 bg-white">
            <ul className="divide-y divide-tinta-900/10">
              {inscricoes.map((inscricao, index) => (
                <InscricaoItem key={inscricao.id} inscricao={inscricao} destaqueTour={index === 0} />
              ))}
            </ul>
          </div>

          <div id="tour-inscricoes-paginacao">
            <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-6" />
          </div>
        </>
      )}
    </section>
  )
}
