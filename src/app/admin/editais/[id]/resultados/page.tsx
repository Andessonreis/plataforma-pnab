import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { editalStatusLabel } from '@/lib/status-maps'
import { ResultActions } from './result-actions'
import { PreviewSection } from './preview-section'
import { PublishedResults } from './published-results'
import type { CategoriaConfig } from '@/types/categoria-config'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminResultadosPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') notFound()

  const { id } = await params

  const edital = await prisma.edital.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      ano: true,
      status: true,
      vagasContemplados: true,
      vagasSuplentes: true,
      notaMinima: true,
      formulaAvaliacao: true,
      categoriasConfig: true,
    },
  })

  if (!edital) notFound()

  const categoriasConfig = Array.isArray(edital.categoriasConfig)
    ? (edital.categoriasConfig as unknown as CategoriaConfig[])
    : null

  // "Consolidado" = as notas já foram gravadas (notaFinal preenchida). O status do
  // edital pode estar em RESULTADO_PRELIMINAR sem consolidação (avanço automático de
  // fase); nesse caso ainda mostramos a prévia para o admin consolidar e publicar.
  const consolidado =
    (await prisma.inscricao.count({ where: { editalId: id, notaFinal: { not: null } } })) > 0
  const temAvaliacoes =
    (await prisma.avaliacao.count({ where: { inscricao: { editalId: id }, finalizada: true } })) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/editais/${id}`} className="text-sm text-brand-600 hover:text-brand-700">
              Voltar ao edital
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Resultados — {edital.titulo} ({edital.ano})
          </h1>
          <p className="text-sm text-slate-500 mt-1">Status: {editalStatusLabel[edital.status]}</p>
        </div>
      </div>

      {/* Ações de publicação */}
      <ResultActions
        editalId={edital.id}
        editalStatus={edital.status}
        temAvaliacoes={temAvaliacoes}
        consolidado={consolidado}
      />

      {consolidado ? (
        <PublishedResults editalId={id} categoriasConfig={categoriasConfig} />
      ) : (
        <PreviewSection
          editalId={id}
          vagas={{
            contemplados: edital.vagasContemplados,
            suplentes: edital.vagasSuplentes,
            notaMinima: edital.notaMinima != null ? Number(edital.notaMinima) : null,
          }}
          categoriasConfig={categoriasConfig}
          hasFormula={!!edital.formulaAvaliacao}
        />
      )}
    </div>
  )
}
