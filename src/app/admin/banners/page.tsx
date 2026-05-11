import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconInfo } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Banner Topo — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminBannersPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const statusFilter = params.status || undefined

  const where = statusFilter === 'ativo'
    ? { ativo: true }
    : statusFilter === 'inativo'
      ? { ativo: false }
      : {}

  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.banner.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const now = new Date()

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Banner Topo</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              {total} banner(s) — exibidos na faixa superior do site público
            </p>
          </div>
          <Button href="/admin/banners/novo" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Banner</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </FadeIn>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/banners?status=${opt.value}` : '/admin/banners'}
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

      {banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconInfo className="h-8 w-8 text-slate-400" />}
            title="Nenhum banner"
            description="Crie o primeiro banner para a faixa superior do site público."
            action={{ label: 'Novo Banner', href: '/admin/banners/novo' }}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {banners.map((banner) => {
              const visivel = banner.ativo && banner.inicioEm <= now && banner.fimEm >= now
              return (
                <Link
                  key={banner.id}
                  href={`/admin/banners/${banner.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">{banner.titulo}</p>
                    <Badge variant={visivel ? 'success' : 'neutral'}>
                      {visivel ? 'Visível' : banner.ativo ? 'Fora do período' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-1.5">{banner.texto}</p>
                  <div className="text-[11px] text-slate-500">
                    {new Date(banner.inicioEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    {' → '}
                    {new Date(banner.fimEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Desktop: tabela */}
          <Card padding="sm" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Período</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner) => {
                    const visivel = banner.ativo && banner.inicioEm <= now && banner.fimEm >= now
                    return (
                      <tr key={banner.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{banner.titulo}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{banner.texto}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={visivel ? 'success' : 'neutral'}>
                            {visivel ? 'Visível' : banner.ativo ? 'Fora do período' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {new Date(banner.inicioEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                          {' → '}
                          {new Date(banner.fimEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/banners/${banner.id}`}
                            className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={statusFilter ? `/admin/banners?status=${statusFilter}` : '/admin/banners'}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
