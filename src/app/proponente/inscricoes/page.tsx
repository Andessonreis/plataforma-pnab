import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minhas Inscricoes — Portal PNAB Irece',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function MinhasInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 10
  const userId = session.user.id

  const [inscricoes, total] = await Promise.all([
    prisma.inscricao.findMany({
      where: { proponenteId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { titulo: true, slug: true } },
      },
    }),
    prisma.inscricao.count({ where: { proponenteId: userId } }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas Inscricoes</h1>
          <p className="text-slate-600 mt-1">{total} inscricao(oes) encontrada(s)</p>
        </div>
        <Link
          href="/editais"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Inscricao
        </Link>
      </div>

      {inscricoes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900 mt-4">Nenhuma inscricao</h2>
            <p className="text-slate-500 mt-1">Voce ainda nao se inscreveu em nenhum edital.</p>
            <Link
              href="/editais"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors mt-4 min-h-[44px]"
            >
              Ver Editais Abertos
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Tabela desktop */}
          <Card className="hidden md:block overflow-hidden" padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Numero</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Enviada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.map((inscricao) => (
                    <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{inscricao.numero}</td>
                      <td className="py-3 px-4 font-medium">{inscricao.edital.titulo}</td>
                      <td className="py-3 px-4 text-slate-600">{inscricao.categoria ?? '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {inscricao.submittedAt
                          ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/proponente/inscricoes/${inscricao.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {inscricoes.map((inscricao) => (
              <Card key={inscricao.id} hover padding="md">
                <Link href={`/proponente/inscricoes/${inscricao.id}`} className="block">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs text-slate-500">{inscricao.numero}</span>
                    <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                      {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-slate-900">{inscricao.edital.titulo}</h3>
                  {inscricao.categoria && (
                    <p className="text-sm text-slate-500 mt-1">Categoria: {inscricao.categoria}</p>
                  )}
                  {inscricao.submittedAt && (
                    <p className="text-xs text-slate-400 mt-2">
                      Enviada em {new Date(inscricao.submittedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </Link>
              </Card>
            ))}
          </div>

          {/* Paginacao */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/proponente/inscricoes"
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
