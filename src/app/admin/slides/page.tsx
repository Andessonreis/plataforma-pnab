import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconSlides } from '@client/components/ui'

export const metadata: Metadata = {
  title: 'Slides da Home — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminSlidesPage({ searchParams }: Props) {
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

  const [slides, total] = await Promise.all([
    prisma.slideDestaque.findMany({
      where,
      orderBy: { ordem: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.slideDestaque.count({ where }),
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Slides da Home</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">{total} slide(s)</p>
          </div>
          <Button href="/admin/slides/novo" size="sm">
            <IconPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Slide</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </FadeIn>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/slides?status=${opt.value}` : '/admin/slides'}
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

      {slides.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconSlides className="h-8 w-8 text-slate-400" />}
            title="Nenhum slide"
            description="Crie o primeiro slide para o carrossel da home."
            action={{ label: 'Novo Slide', href: '/admin/slides/novo' }}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {slides.map((slide) => (
              <Link
                key={slide.id}
                href={`/admin/slides/${slide.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">{slide.titulo}</p>
                  <Badge variant={slide.ativo ? 'success' : 'neutral'}>
                    {slide.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Ordem: {slide.ordem}</span>
                  {slide.inicioEm && (
                    <span>
                      De: {new Date(slide.inicioEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </span>
                  )}
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Período</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((slide) => (
                    <tr key={slide.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono">{slide.ordem}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{slide.titulo}</p>
                          {slide.descricao && (
                            <p className="text-xs text-slate-500 line-clamp-1">{slide.descricao}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={slide.ativo ? 'success' : 'neutral'}>
                          {slide.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {slide.inicioEm || slide.fimEm ? (
                          <>
                            {slide.inicioEm
                              ? new Date(slide.inicioEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                              : '—'}
                            {' → '}
                            {slide.fimEm
                              ? new Date(slide.fimEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                              : '—'}
                          </>
                        ) : (
                          'Sempre visível'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/slides/${slide.id}`}
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
            baseUrl={statusFilter ? `/admin/slides?status=${statusFilter}` : '/admin/slides'}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
