import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconInstagram } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Dia a Dia da Secretaria — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminMomentosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || !['SUPER_ADMIN', 'COMUNICACAO'].includes(session.user.role)) redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const statusFilter = params.status || undefined

  const where = statusFilter === 'ativo'
    ? { ativo: true }
    : statusFilter === 'inativo'
      ? { ativo: false }
      : {}

  const [momentos, total] = await Promise.all([
    prisma.momentoSecretaria.findMany({
      where,
      orderBy: { ordem: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.momentoSecretaria.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'inativo', label: 'Inativos' },
  ]

  return (
    <section>
      <FadeIn>
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dia a Dia da Secretaria</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              {total} momento(s) — carrossel exibido na home, com link para a publicação no Instagram
            </p>
          </div>
          <Button href="/admin/momentos/novo" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Momento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </FadeIn>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/momentos?status=${opt.value}` : '/admin/momentos'}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              (statusFilter ?? '') === opt.value || (!statusFilter && opt.value === '')
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {momentos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInstagram className="h-8 w-8 text-slate-400" />}
            title="Nenhum momento cadastrado"
            description="Cadastre o primeiro momento do dia a dia da Secretaria para exibir na home."
            action={{ label: 'Novo Momento', href: '/admin/momentos/novo' }}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {momentos.map((momento) => (
              <Link
                key={momento.id}
                href={`/admin/momentos/${momento.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={momento.imagemUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-1">
                      {momento.categoria}
                    </p>
                    <Badge variant={momento.ativo ? 'success' : 'neutral'}>
                      {momento.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Ordem: {momento.ordem}</p>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ordem</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Capa</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {momentos.map((momento) => (
                    <tr key={momento.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono">{momento.ordem}</td>
                      <td className="py-3 px-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={momento.imagemUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{momento.categoria}</td>
                      <td className="py-3 px-4">
                        <Badge variant={momento.ativo ? 'success' : 'neutral'}>
                          {momento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/momentos/${momento.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                        >
                          Editar
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
            baseUrl={statusFilter ? `/admin/momentos?status=${statusFilter}` : '/admin/momentos'}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
