import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'
import InscricaoForm from './inscricao-form'

export const metadata: Metadata = {
  title: 'Nova Inscrição — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ editalId?: string }>
}

export default async function NovaInscricaoPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'PROPONENTE') {
    redirect('/login')
  }

  const { editalId } = await searchParams
  if (!editalId) {
    redirect('/editais')
  }

  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: {
      id: true,
      titulo: true,
      categorias: true,
      camposFormulario: true,
      status: true,
    },
  })

  if (!edital || edital.status !== 'INSCRICOES_ABERTAS') {
    redirect('/editais')
  }

  // Verificar se já tem inscrição neste edital
  const existing = await prisma.inscricao.findFirst({
    where: { editalId, proponenteId: session.user.id },
  })

  if (existing) {
    redirect(`/proponente/inscricoes/${existing.id}/editar`)
  }

  // Preparar dados do edital para o formulário
  const camposFormulario = Array.isArray(edital.camposFormulario)
    ? edital.camposFormulario
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/proponente/inscricoes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para inscrições
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nova Inscrição</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edital: <span className="font-medium text-slate-700">{edital.titulo}</span>
        </p>
      </div>

      {/* Formulário */}
      <InscricaoForm
        edital={{
          id: edital.id,
          titulo: edital.titulo,
          categorias: edital.categorias,
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
      />
    </div>
  )
}
