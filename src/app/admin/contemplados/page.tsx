import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { ImportForm } from './import-form'

export const metadata: Metadata = {
  title: 'Importar Contemplados — Portal PNAB Irece',
}

// Mapa de status de execucao para exibicao
const statusExecucaoLabel: Record<string, string> = {
  EM_EXECUCAO: 'Em Execucao',
  CONCLUIDO: 'Concluido',
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

  // Buscar dados em paralelo
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Importar Contemplados</h1>
        <p className="text-slate-600 mt-1">
          Importe projetos contemplados a partir de um arquivo CSV vinculado a um edital.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg p-3 bg-brand-50">
              <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalContemplados}</p>
              <p className="text-sm text-slate-600">Projetos Apoiados</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg p-3 bg-blue-50">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              {lastImportLog ? (
                <>
                  <p className="text-sm font-medium text-slate-900">
                    Ultima importacao
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
                  <p className="text-sm font-medium text-slate-900">Ultima importacao</p>
                  <p className="text-xs text-slate-500">Nenhuma importacao realizada.</p>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Formulario de importacao */}
      <div className="mb-8">
        <ImportForm editais={editaisOptions} />
      </div>

      {/* Tabela de projetos existentes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Projetos Apoiados Recentes</h2>
          <Badge variant="neutral">{totalContemplados} total</Badge>
        </div>

        {recentProjetos.length === 0 ? (
          <p className="text-center py-8 text-slate-500">
            Nenhum projeto apoiado cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-6 py-3 font-medium text-slate-600">Inscricao</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Proponente</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Edital</th>
                  <th className="px-6 py-3 font-medium text-slate-600 text-right">Valor</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProjetos.map((projeto) => (
                  <tr key={projeto.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">
                      {projeto.inscricao.numero}
                    </td>
                    <td className="px-6 py-3 text-slate-900">
                      {projeto.inscricao.proponente.nome}
                    </td>
                    <td className="px-6 py-3 text-slate-600 max-w-[200px] truncate">
                      {projeto.inscricao.edital.titulo}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      {Number(projeto.valorAprovado).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusExecucaoVariant[projeto.statusExecucao] ?? 'neutral'}>
                        {statusExecucaoLabel[projeto.statusExecucao] ?? projeto.statusExecucao}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {new Date(projeto.createdAt).toLocaleDateString('pt-BR')}
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
