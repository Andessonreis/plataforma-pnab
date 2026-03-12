import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconClipboard } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minhas Avaliações — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function AvaliadorInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const searchQuery = params.search || undefined

  const where: Record<string, unknown> = {
    avaliacoes: { some: { avaliadorId: session.user.id } },
  }
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
    ]
  }

  const [inscricoes, total] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { titulo: true } },
        proponente: { select: { nome: true, cpfCnpj: true } },
        avaliacoes: {
          where: { avaliadorId: session.user.id },
          select: { finalizada: true, notaTotal: true },
        },
      },
    }),
    prisma.inscricao.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const filterParams = new URLSearchParams()
  if (searchQuery) filterParams.set('search', searchQuery)
  const baseUrl = `/avaliador/inscricoes${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Minhas Avaliações</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {total} inscrição(ões) atribuída(s) a você
          </p>
        </div>
      </FadeIn>

      {/* Busca */}
      <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
        <form method="get" action="/avaliador/inscricoes" className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1.5">Buscar</label>
            <input
              id="search" name="search" type="text" defaultValue={searchQuery}
              placeholder="Nome ou número da inscrição..."
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            />
          </div>
          <Button type="submit">Filtrar</Button>
          <Button href="/avaliador/inscricoes" variant="ghost">Limpar</Button>
        </form>
      </Card>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhuma inscrição atribuída"
            description="Você ainda não possui inscrições atribuídas para avaliação."
          />
        </Card>
      ) : (
        <>
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {inscricoes.map((ins) => {
              const minha = ins.avaliacoes[0]
              return (
                <Link
                  key={ins.id}
                  href={`/avaliador/inscricoes/${ins.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3.5 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-slate-900">{ins.proponente.nome}</p>
                    {minha ? (
                      <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${minha.finalizada ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                        {minha.finalizada ? `Nota: ${Number(minha.notaTotal)}` : 'Pendente'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 shrink-0">Pendente</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-1 line-clamp-1">{ins.edital.titulo}</p>
                  <span className="text-[11px] font-mono text-slate-400">{ins.numero}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop */}
          <Card padding="sm" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Inscrição</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Proponente</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Avaliação</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.map((ins) => {
                    const minha = ins.avaliacoes[0]
                    return (
                      <tr key={ins.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">{ins.numero}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{ins.proponente.nome}</p>
                          <p className="text-xs text-slate-500">{ins.proponente.cpfCnpj}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{ins.edital.titulo}</td>
                        <td className="py-3 px-4 text-slate-600">{ins.categoria ?? '—'}</td>
                        <td className="py-3 px-4">
                          {minha ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${minha.finalizada ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                              {minha.finalizada ? `Nota: ${Number(minha.notaTotal)}` : 'Pendente'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Pendente</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/avaliador/inscricoes/${ins.id}`} className="text-brand-600 hover:text-brand-700 font-medium text-xs">
                            {minha?.finalizada ? 'Ver' : 'Avaliar'}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} className="mt-4 sm:mt-6" />
        </>
      )}
    </section>
  )
}
