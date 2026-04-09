import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EditalForm } from '../edital-form'
import { AcessivelEditor } from './acessivel-editor'
import type { EditalStatus } from '@prisma/client'
import type { CronogramaItem } from '@/types/cronograma'
import { migrateLegacyCronograma } from '@/lib/utils/cronograma'
import { RelatorioFinalButton } from './relatorio-final-button'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { CampoFormulario } from '@/types/campo-formulario'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const edital = await prisma.edital.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: `Editar: ${edital?.titulo ?? id} — Portal PNAB Irece` }
}

interface TipoAnexo {
  tipo: string
  label: string
  obrigatorio: boolean
}

export default async function EditarEditalPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const edital = await prisma.edital.findUnique({ where: { id } })

  if (!edital) notFound()

  // Buscar membros da equipe do edital
  const membrosEdital = await prisma.editalMembro.findMany({
    where: { editalId: id },
    include: { user: { select: { id: true, nome: true, email: true } } },
  })
  const avaliadores = membrosEdital
    .filter((m) => m.funcao === 'AVALIADOR')
    .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))
  const habilitadores = membrosEdital
    .filter((m) => m.funcao === 'HABILITADOR')
    .map((m) => ({ id: m.user.id, nome: m.user.nome, email: m.user.email }))

  // Migra cronograma legado para formato novo (se necessário)
  const cronograma = migrateLegacyCronograma(edital.cronograma) as CronogramaItem[]
  const camposFormulario = (Array.isArray(edital.camposFormulario) ? edital.camposFormulario : []) as unknown as CampoFormulario[]

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/editais"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Editais
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Edital</h1>
        <p className="text-slate-600 mt-1">{edital.titulo}</p>
      </div>

      <EditalForm
        initialData={{
          id: edital.id,
          titulo: edital.titulo,
          resumo: edital.resumo ?? '',
          ano: edital.ano,
          valorTotal: edital.valorTotal ? String(edital.valorTotal) : '',
          categorias: edital.categorias,
          acoesAfirmativas: edital.acoesAfirmativas ?? '',
          regrasElegibilidade: edital.regrasElegibilidade ?? '',
          cronograma,
          camposFormulario,
          status: edital.status as EditalStatus,
          vagasContemplados: edital.vagasContemplados,
          vagasSuplentes: edital.vagasSuplentes,
          criteriosAvaliacao: (Array.isArray(edital.criteriosAvaliacao)
            ? edital.criteriosAvaliacao : []) as CriterioAvaliacao[],
          formulaAvaliacao: (edital.formulaAvaliacao as string) ?? '',
          tiposAnexo: (Array.isArray(edital.tiposAnexo)
            ? edital.tiposAnexo : null) as TipoAnexo[] | null,
          notaMinima: edital.notaMinima ? Number(edital.notaMinima) : null,
          tiposProponentePermitidos: edital.tiposProponentePermitidos ?? [],
          initialAvaliadores: avaliadores,
          initialHabilitadores: habilitadores,
        }}
      />

      {/* Seção de Conteúdo Acessível */}
      <div className="mt-8">
        <AcessivelEditor
          editalId={edital.id}
          initialContent={edital.conteudoAcessivel ?? ''}
          editalSlug={edital.slug}
        />
      </div>

      {/* Links para Resultados e Listas */}
      <div className="mt-6 flex gap-3">
        <Link
          href={`/admin/editais/${edital.id}/resultados`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ver Resultados
        </Link>
        <Link
          href={`/admin/editais/${edital.id}/listas`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 bg-brand-50 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Gerar Listas
        </Link>
        {(['RESULTADO_FINAL', 'ENCERRADO'] as EditalStatus[]).includes(edital.status as EditalStatus) && (
          <RelatorioFinalButton editalId={edital.id} />
        )}
      </div>
    </section>
  )
}
