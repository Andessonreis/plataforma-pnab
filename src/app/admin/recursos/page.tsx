import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'

export default async function AdminRecursosPage() {
  const session = await auth()
  if (!session || !['ADMIN', 'HABILITADOR'].includes(session.user.role)) notFound()

  const recursos = await prisma.recurso.findMany({
    include: {
      inscricao: {
        include: {
          proponente: { select: { nome: true } },
          edital: { select: { titulo: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const pendentes = recursos.filter((r) => !r.decisao)
  const decididos = recursos.filter((r) => r.decisao)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recursos</h1>
        <p className="text-sm text-slate-500 mt-1">
          {pendentes.length} pendente(s) | {decididos.length} decidido(s)
        </p>
      </div>

      {recursos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Nenhum recurso registrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Edital</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Fase</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recursos.map((recurso) => (
                  <tr key={recurso.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {recurso.inscricao.proponente.nome}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {recurso.inscricao.edital.titulo}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{formatFase(recurso.fase)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {formatDate(recurso.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {recurso.decisao ? (
                        <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                          {recurso.decisao === 'DEFERIDO' ? 'Deferido' : 'Indeferido'}
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pendente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/inscricoes/${recurso.inscricaoId}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        {recurso.decisao ? 'Ver' : 'Decidir'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatFase(fase: string): string {
  const map: Record<string, string> = {
    HABILITACAO: 'Habilitação',
    RESULTADO_PRELIMINAR: 'Resultado Preliminar',
    RESULTADO_FINAL: 'Resultado Final',
  }
  return map[fase] ?? fase
}
