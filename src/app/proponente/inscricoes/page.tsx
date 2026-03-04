import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, Pagination, Button, EmptyState, FadeIn, IconPlus, IconClipboard } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minhas Inscrições — Portal PNAB Irecê',
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
      <FadeIn>
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Minhas Inscrições</h1>
            <p className="text-sm text-slate-600 mt-1">{total} inscrição(ões) encontrada(s)</p>
          </div>
          <Button href="/editais" size="sm" className="shrink-0">
            <IconPlus className="h-4 w-4 mr-1.5" />
            Nova
          </Button>
        </div>
      </FadeIn>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhuma inscrição"
            description="Você ainda não se inscreveu em nenhum edital."
            action={{ label: 'Ver Editais Abertos', href: '/editais' }}
          />
        </Card>
      ) : (
        <>
          {/* Tabela desktop */}
          <Card className="hidden md:block overflow-hidden" padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Número</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Edital</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Enviada em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Ações</th>
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
              <Card key={inscricao.id} hover padding="sm">
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
