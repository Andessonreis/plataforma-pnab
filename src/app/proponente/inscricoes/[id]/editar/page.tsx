import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'
import InscricaoForm from '../../nova/inscricao-form'

export const metadata: Metadata = {
  title: 'Editar Inscrição — Portal PNAB Irecê',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarInscricaoPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'PROPONENTE') {
    redirect('/login')
  }

  const { id } = await params

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: {
        select: {
          id: true,
          titulo: true,
          categorias: true,
          camposFormulario: true,
          status: true,
        },
      },
      anexos: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          tipo: true,
          titulo: true,
          url: true,
          createdAt: true,
        },
      },
    },
  })

  if (!inscricao) {
    notFound()
  }

  if (inscricao.proponenteId !== session.user.id) {
    redirect('/proponente/inscricoes')
  }

  if (inscricao.status !== 'RASCUNHO') {
    redirect(`/proponente/inscricoes/${id}`)
  }

  const camposFormulario = Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario
    : []

  const campos = (inscricao.campos && typeof inscricao.campos === 'object')
    ? inscricao.campos as Record<string, unknown>
    : {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/proponente/inscricoes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para detalhes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Inscrição</h1>
        <p className="text-sm text-slate-500 mt-1">
          {inscricao.numero} — {inscricao.edital.titulo}
        </p>
      </div>

      {/* Formulário com dados pré-preenchidos */}
      <InscricaoForm
        edital={{
          id: inscricao.edital.id,
          titulo: inscricao.edital.titulo,
          categorias: inscricao.edital.categorias,
          camposFormulario: camposFormulario as Array<{
            nome: string
            label: string
            tipo: 'texto' | 'textarea' | 'select' | 'numero' | 'data' | 'arquivo'
            obrigatorio?: boolean
            placeholder?: string
            opcoes?: string[]
            hint?: string
          }>,
        }}
        inscricaoId={inscricao.id}
        initialCategoria={inscricao.categoria ?? ''}
        initialCampos={campos}
        initialAnexos={inscricao.anexos.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
