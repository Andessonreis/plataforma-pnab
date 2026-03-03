import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Gestao de FAQ — Portal PNAB Irece',
}

interface Props {
  searchParams: Promise<{ page?: string; editalId?: string; publicado?: string }>
}

export default async function AdminFaqPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const editalFilter = params.editalId || undefined
  const publicadoFilter = params.publicado

  // Montar filtros
  const where: Record<string, unknown> = {}
  if (editalFilter) {
    where.editalId = editalFilter
  }
  if (publicadoFilter === 'true') {
    where.publicado = true
  } else if (publicadoFilter === 'false') {
    where.publicado = false
  }

  const [faqItems, total, editais] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { id: true, titulo: true } },
      },
    }),
    prisma.faqItem.count({ where }),
    prisma.edital.findMany({
      select: { id: true, titulo: true },
      orderBy: { titulo: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  // Montar URL base para paginacao preservando filtros
  function buildBaseUrl() {
    const parts: string[] = []
    if (editalFilter) parts.push(`editalId=${editalFilter}`)
    if (publicadoFilter) parts.push(`publicado=${publicadoFilter}`)
    return parts.length > 0 ? `/admin/faq?${parts.join('&')}` : '/admin/faq'
  }

  // Montar URL para filtros
  function buildFilterUrl(filters: { editalId?: string; publicado?: string }) {
    const parts: string[] = []
    const eid = filters.editalId ?? editalFilter
    const pub = filters.publicado ?? publicadoFilter
    if (eid) parts.push(`editalId=${eid}`)
    if (pub) parts.push(`publicado=${pub}`)
    return parts.length > 0 ? `/admin/faq?${parts.join('&')}` : '/admin/faq'
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestao de FAQ</h1>
          <p className="text-slate-600 mt-1">{total} item(ns) encontrado(s)</p>
        </div>
        <Link
          href="/admin/faq/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Item
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Filtro por edital */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Edital:</span>
          <Link
            href={buildFilterUrl({ editalId: undefined, publicado: publicadoFilter })}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              !editalFilter
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Todos
          </Link>
          {editais.map((edital) => (
            <Link
              key={edital.id}
              href={`/admin/faq?editalId=${edital.id}${publicadoFilter ? `&publicado=${publicadoFilter}` : ''}`}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center max-w-[200px] truncate',
                editalFilter === edital.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
              title={edital.titulo}
            >
              {edital.titulo}
            </Link>
          ))}
        </div>

        {/* Filtro por status de publicacao */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status:</span>
          <Link
            href={buildFilterUrl({ publicado: undefined, editalId: editalFilter })}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              !publicadoFilter
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Todos
          </Link>
          <Link
            href={`/admin/faq?publicado=true${editalFilter ? `&editalId=${editalFilter}` : ''}`}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              publicadoFilter === 'true'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Publicados
          </Link>
          <Link
            href={`/admin/faq?publicado=false${editalFilter ? `&editalId=${editalFilter}` : ''}`}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] inline-flex items-center',
              publicadoFilter === 'false'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Ocultos
          </Link>
        </div>
      </div>

      {faqItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhum item de FAQ</h2>
            <p className="text-slate-500 mt-1">Crie o primeiro item para comecar.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card padding="sm" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Pergunta</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Ordem</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {faqItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 line-clamp-2">{item.pergunta}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.resposta}</p>
                      </td>
                      <td className="py-3 px-4">
                        {item.edital ? (
                          <span className="text-sm text-slate-700" title={item.edital.titulo}>
                            {item.edital.titulo.length > 30
                              ? `${item.edital.titulo.slice(0, 30)}...`
                              : item.edital.titulo}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Geral</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {item.ordem}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.publicado ? 'success' : 'neutral'}>
                          {item.publicado ? 'Publicado' : 'Oculto'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/faq/${item.id}`}
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
            baseUrl={buildBaseUrl()}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
