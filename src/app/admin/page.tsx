import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Painel da Secretaria — Portal PNAB Irece',
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [
    totalEditais,
    editaisAbertos,
    totalInscricoes,
    inscricoesEnviadas,
    totalProponentes,
    recentLogs,
  ] = await Promise.all([
    prisma.edital.count(),
    prisma.edital.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
    prisma.inscricao.count(),
    prisma.inscricao.count({ where: { status: 'ENVIADA' } }),
    prisma.user.count({ where: { role: 'PROPONENTE' } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { nome: true } } },
    }),
  ])

  const stats = [
    {
      label: 'Editais',
      value: totalEditais,
      sub: `${editaisAbertos} aberto(s)`,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      href: '/admin/editais',
    },
    {
      label: 'Inscricoes',
      value: totalInscricoes,
      sub: `${inscricoesEnviadas} pendente(s)`,
      color: 'bg-accent-50',
      iconColor: 'text-accent-600',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/admin/inscricoes',
    },
    {
      label: 'Proponentes',
      value: totalProponentes,
      sub: 'cadastrados',
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/admin/usuarios',
    },
    {
      label: 'Editais Abertos',
      value: editaisAbertos,
      sub: 'com inscricoes abertas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/admin/editais',
    },
  ]

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Painel da Secretaria</h1>
        <p className="text-slate-600 mt-1">
          Visao geral das atividades do Portal PNAB Irece.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover padding="md">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm font-medium text-slate-900">{stat.label}</p>
                  <p className="text-xs text-slate-500">{stat.sub}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Acoes rapidas */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/admin/editais/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Edital
        </Link>
        <Link
          href="/admin/inscricoes"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-brand-600 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
        >
          Gerenciar Inscricoes
        </Link>
        <Link
          href="/admin/inscricoes/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </Link>
      </div>

      {/* Atividade recente */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Atividade Recente</h2>
          <Link href="/admin/logs" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Ver todos
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-center py-8 text-slate-500">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{log.user?.nome ?? 'Sistema'}</span>
                    {' — '}
                    <Badge variant="neutral">{log.action}</Badge>
                  </p>
                  {log.entity && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}
