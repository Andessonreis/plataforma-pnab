import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { editalStatusLabel } from '@/lib/status-maps'
import { ResultActions } from './result-actions'
import type { InscricaoStatus } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminResultadosPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') notFound()

  const { id } = await params

  const edital = await prisma.edital.findUnique({
    where: { id },
    select: { id: true, titulo: true, ano: true, status: true },
  })

  if (!edital) notFound()

  // Busca inscrições com notas
  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId: id,
      status: { notIn: ['RASCUNHO', 'ENVIADA'] },
    },
    include: {
      proponente: { select: { nome: true, cpfCnpj: true } },
      avaliacoes: {
        where: { finalizada: true },
        select: { notaTotal: true },
      },
    },
    orderBy: { notaFinal: { sort: 'desc', nulls: 'last' } },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/admin/editais/${id}`}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Voltar ao edital
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Resultados — {edital.titulo} ({edital.ano})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Status: {editalStatusLabel[edital.status]} | {inscricoes.length} inscrições classificáveis
          </p>
        </div>
      </div>

      {/* Ações */}
      <ResultActions editalId={edital.id} editalStatus={edital.status} />

      {/* Tabela de resultados */}
      {inscricoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Nenhuma inscrição classificável encontrada.</p>
          <p className="text-sm text-slate-400 mt-1">
            As inscrições precisam estar habilitadas e avaliadas para aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Avaliações</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota Final</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inscricoes.map((inscricao, index) => (
                  <tr key={inscricao.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                        <p className="text-xs text-slate-400">{inscricao.numero}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {inscricao.categoria ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {inscricao.avaliacoes.length}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {inscricao.notaFinal ? Number(inscricao.notaFinal).toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                        {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/inscricoes/${inscricao.id}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Detalhes
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
