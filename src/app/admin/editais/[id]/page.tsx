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

interface CampoFormulario {
  nome: string
  label: string
  tipo: 'texto' | 'textarea' | 'select' | 'numero' | 'data' | 'arquivo'
  obrigatorio: boolean
  placeholder: string
  opcoes: string[]
  hint: string
}

export default async function EditarEditalPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const edital = await prisma.edital.findUnique({ where: { id } })

  if (!edital) notFound()

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

      {/* Link para Resultados */}
      <div className="mt-6 flex gap-3">
        <Link
          href={`/admin/editais/${edital.id}/resultados`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ver Resultados
        </Link>
      </div>
    </section>
  )
}
