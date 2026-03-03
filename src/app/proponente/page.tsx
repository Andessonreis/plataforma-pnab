import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Minha Area — Portal PNAB Irece',
}

export default async function ProponenteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = session.user.id

  // Busca dados em paralelo
  const [totalInscricoes, inscricoesEnviadas, inscricoesContempladas, recentInscricoes, editaisAbertos] =
    await Promise.all([
      prisma.inscricao.count({ where: { proponenteId: userId } }),
      prisma.inscricao.count({
        where: { proponenteId: userId, status: 'ENVIADA' },
      }),
      prisma.inscricao.count({
        where: { proponenteId: userId, status: 'CONTEMPLADA' },
      }),
      prisma.inscricao.findMany({
        where: { proponenteId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { edital: { select: { titulo: true, slug: true } } },
      }),
      prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    ])

  const stats = [
    {
      label: 'Total de Inscricoes',
      value: totalInscricoes,
      icon: (
        <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-brand-50',
    },
    {
      label: 'Pendentes',
      value: inscricoesEnviadas,
      icon: (
        <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-accent-50',
    },
    {
      label: 'Contempladas',
      value: inscricoesContempladas,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-50',
    },
    {
      label: 'Editais Abertos',
      value: editaisAbertos,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      color: 'bg-blue-50',
    },
  ]

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Bem-vindo(a), {session.user.name?.split(' ')[0] ?? 'Proponente'}
        </h1>
        <p className="text-slate-600 mt-1">
          Acompanhe suas inscricoes e gerencie seu perfil.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Acoes rapidas */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/editais"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ver Editais Abertos
        </Link>
        <Link
          href="/proponente/inscricoes"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-brand-600 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
        >
          Minhas Inscricoes
        </Link>
      </div>

      {/* Inscricoes recentes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Inscricoes Recentes</h2>
          {totalInscricoes > 5 && (
            <Link href="/proponente/inscricoes" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Ver todas
            </Link>
          )}
        </div>

        {recentInscricoes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 mt-2">Nenhuma inscricao ainda.</p>
            <Link
              href="/editais"
              className="inline-block mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Confira os editais abertos
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Numero</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Edital</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600">Data</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-600">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {recentInscricoes.map((inscricao) => (
                  <tr key={inscricao.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono text-xs">{inscricao.numero}</td>
                    <td className="py-3 px-2">{inscricao.edital.titulo}</td>
                    <td className="py-3 px-2">
                      <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                        {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-slate-500">
                      {new Date(inscricao.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/proponente/inscricoes/${inscricao.id}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  )
}
