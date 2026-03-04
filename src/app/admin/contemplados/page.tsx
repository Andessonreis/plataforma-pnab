import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge, StatCard, EmptyState, FadeIn, StaggerContainer, StaggerItem, IconCheck, IconClock } from '@/components/ui'
import { ImportForm } from './import-form'

export const metadata: Metadata = {
  title: 'Importar Contemplados — Portal PNAB Irecê',
}

const statusExecucaoLabel: Record<string, string> = {
  EM_EXECUCAO: 'Em Execução',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  SUSPENSO: 'Suspenso',
}

const statusExecucaoVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  EM_EXECUCAO: 'info',
  CONCLUIDO: 'success',
  CANCELADO: 'error',
  SUSPENSO: 'warning',
}

export default async function ContempladosPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/admin')

  const [totalContemplados, editais, recentProjetos, lastImportLog] = await Promise.all([
    prisma.projetoApoiado.count(),
    prisma.edital.findMany({
      select: { id: true, titulo: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.projetoApoiado.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        inscricao: {
          select: {
            numero: true,
            edital: { select: { titulo: true } },
            proponente: { select: { nome: true } },
          },
        },
      },
    }),
    prisma.auditLog.findFirst({
      where: { action: 'IMPORTACAO_CONTEMPLADOS' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nome: true } } },
    }),
  ])

  const editaisOptions = editais.map((e) => ({ id: e.id, titulo: e.titulo }))

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Importar Contemplados</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Importe projetos contemplados a partir de um arquivo CSV vinculado a um edital.
          </p>
        </div>
      </FadeIn>

      {/* Resumo */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StaggerItem>
          <StatCard
            icon={<IconCheck className="h-8 w-8" />}
            label="Projetos Apoiados"
            value={totalContemplados}
            color="bg-brand-50"
            iconColor="text-brand-600"
          />
        </StaggerItem>
        <StaggerItem>
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="rounded-lg p-3 bg-blue-50">
                <IconClock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                {lastImportLog ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">
                      Última importação
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(lastImportLog.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' por '}
                      {lastImportLog.user?.nome ?? 'Sistema'}
                    </p>
                    {lastImportLog.details && typeof lastImportLog.details === 'object' && (
                      <p className="text-xs text-slate-500">
                        {String((lastImportLog.details as Record<string, unknown>).importados ?? 0)} importados,{' '}
                        {String((lastImportLog.details as Record<string, unknown>).erros ?? 0)} erros
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-900">Última importação</p>
                    <p className="text-xs text-slate-500">Nenhuma importação realizada.</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Formulário de importação */}
      <div className="mb-6 sm:mb-8">
        <ImportForm editais={editaisOptions} />
      </div>

      {/* Projetos existentes */}
      <FadeIn delay={0.2}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Projetos Apoiados Recentes</h2>
          <Badge variant="neutral">{totalContemplados} total</Badge>
        </div>

        {recentProjetos.length === 0 ? (
          <Card padding="sm" className="sm:p-6">
            <EmptyState
              icon={<IconCheck className="h-8 w-8 text-slate-400" />}
              title="Nenhum projeto apoiado"
              description="Importe contemplados a partir de um CSV."
            />
          </Card>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {recentProjetos.map((projeto) => (
                <div
                  key={projeto.id}
                  className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-slate-900 leading-snug">{projeto.inscricao.proponente.nome}</p>
                    <Badge variant={statusExecucaoVariant[projeto.statusExecucao] ?? 'neutral'}>
                      {statusExecucaoLabel[projeto.statusExecucao] ?? projeto.statusExecucao}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug mb-2 line-clamp-1">{projeto.inscricao.edital.titulo}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{projeto.inscricao.numero}</span>
                    <span className="font-medium text-slate-900 text-xs">
                      {Number(projeto.valorAprovado).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <Card padding="sm" className="overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-4 py-3 font-medium text-slate-600">Inscrição</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Proponente</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Edital</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-right">Valor</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentProjetos.map((projeto) => (
                      <tr key={projeto.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          {projeto.inscricao.numero}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {projeto.inscricao.proponente.nome}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {projeto.inscricao.edital.titulo}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {Number(projeto.valorAprovado).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusExecucaoVariant[projeto.statusExecucao] ?? 'neutral'}>
                            {statusExecucaoLabel[projeto.statusExecucao] ?? projeto.statusExecucao}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(projeto.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </FadeIn>
    </section>
  )
}
