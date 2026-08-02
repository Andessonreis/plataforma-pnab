import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui'
import { EditalForm } from '../../edital-form'
import { AcessivelEditor } from '../acessivel-editor'
import type { EditalStatus } from '@prisma/client'
import type { CronogramaItem } from '@/types/cronograma'
import { migrateLegacyCronograma } from '@/lib/utils/cronograma'
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
  return { title: `Editar: ${edital?.titulo ?? id} — Portal PNAB Irecê` }
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
  const etapasCustomizadas = (Array.isArray(edital.etapasCustomizadas) ? edital.etapasCustomizadas : []) as unknown as import('@/types/etapa-customizada').EtapaCustomizada[]

  return (
    <section>
      <div className="mb-6">
        <Link
          href={`/admin/editais/${edital.id}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para o edital
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
          categoriasConfig: (Array.isArray(edital.categoriasConfig)
            ? edital.categoriasConfig : null) as unknown as import('@/types/categoria-config').CategoriaConfig[] | null,
          acoesAfirmativas: edital.acoesAfirmativas ?? '',
          regrasElegibilidade: edital.regrasElegibilidade ?? '',
          cronograma,
          camposFormulario,
          etapasCustomizadas,
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
    </section>
  )
}
