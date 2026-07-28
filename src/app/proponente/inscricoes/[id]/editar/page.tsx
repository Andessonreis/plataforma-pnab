import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'
import InscricaoForm from '../../nova/inscricao-form'
import type { CampoFormulario } from '@/types/campo-formulario'

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
          categoriasConfig: true,
          camposFormulario: true,
          etapasCustomizadas: true,
          tiposAnexo: true,
          status: true,
          videoHabilitado: true,
          arquivos: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, tipo: true, titulo: true, url: true, acessivel: true },
          },
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

  // Mapa tipo→label para exibir labels humanos nos badges dos arquivos do edital
  const tipoLabels: Record<string, string> = {}
  if (inscricao.edital.arquivos.length > 0) {
    const tiposUsados = [...new Set(inscricao.edital.arquivos.map((a) => a.tipo))]
    const attachmentTypes = await prisma.attachmentType.findMany({
      where: { tipo: { in: tiposUsados } },
      select: { tipo: true, label: true },
    })
    for (const at of attachmentTypes) {
      tipoLabels[at.tipo] = at.label
    }
  }

  if (inscricao.proponenteId !== session.user.id) {
    redirect('/proponente/inscricoes')
  }

  // Buscar tipo de proponente do usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipoProponente: true },
  })

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
          categoriasConfig: (Array.isArray(inscricao.edital.categoriasConfig)
            ? inscricao.edital.categoriasConfig : null) as unknown as import('@/types/categoria-config').CategoriaConfig[] | null,
          camposFormulario: camposFormulario as unknown as CampoFormulario[],
          etapasCustomizadas: (Array.isArray(inscricao.edital.etapasCustomizadas)
            ? (inscricao.edital.etapasCustomizadas as unknown as import('@/types/etapa-customizada').EtapaCustomizada[])
            : []),
          tiposAnexo: Array.isArray(inscricao.edital.tiposAnexo)
            ? (inscricao.edital.tiposAnexo as Array<{ tipo: string; label: string; obrigatorio: boolean }>)
            : null,
          arquivos: inscricao.edital.arquivos,
          tipoLabels,
          videoHabilitado: inscricao.edital.videoHabilitado,
        }}
        tipoProponente={user?.tipoProponente ?? null}
        inscricaoId={inscricao.id}
        initialCategoria={inscricao.categoria ?? ''}
        initialCotasOptIn={inscricao.cotasOptIn}
        initialCampos={campos}
        initialAnexos={inscricao.anexos.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
