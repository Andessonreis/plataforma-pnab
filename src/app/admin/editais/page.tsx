import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Pagination, Button, EmptyState, FadeIn, IconPlus, IconNews } from '@/components/ui'
import { EditalStatusFilter } from './edital-status-filter'
import { EditalMobileCard } from './edital-mobile-card'
import { EditaisTable } from './editais-table'
import type { EditalStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Gestão de Editais — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminEditaisPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const statusFilter = params.status || undefined

  const where = statusFilter ? { status: statusFilter as EditalStatus } : {}

  const [editais, total] = await Promise.all([
    prisma.edital.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { inscricoes: true } },
      },
    }),
    prisma.edital.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestão de Editais</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{total} edital(ais) encontrado(s)</p>
          </div>
          <Button href="/admin/editais/novo" size="sm" className="sm:size-md">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Edital</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </FadeIn>

      <EditalStatusFilter activeStatus={statusFilter} />

      {editais.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconNews className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital"
            description="Crie o primeiro edital para começar."
            action={{ label: 'Novo Edital', href: '/admin/editais/novo' }}
          />
        </Card>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {editais.map((edital) => (
              <EditalMobileCard key={edital.id} edital={edital} />
            ))}
          </div>

          <EditaisTable editais={editais} />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={statusFilter ? `/admin/editais?status=${statusFilter}` : '/admin/editais'}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
