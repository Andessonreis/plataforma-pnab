import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'
import InscricaoForm from '../../nova/inscricao-form'
import { aplicarDadosPessoaisDoCadastro } from '../../nova/dados-pessoais-cadastro'
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

  // Dados do usuário: tipo de proponente + nome/telefone/e-mail pra completar
  // campos que o rascunho ainda não tem (ex.: salvo antes de chegar na etapa
  // "Dados do Projeto" — sem isso, reabrir pra editar mostrava tudo vazio).
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipoProponente: true, nome: true, email: true, telefone: true },
  })

  if (inscricao.status !== 'RASCUNHO') {
    redirect(`/proponente/inscricoes/${id}`)
  }

  const camposFormulario = Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario
    : []

  const camposSalvos = (inscricao.campos && typeof inscricao.campos === 'object')
    ? inscricao.campos as Record<string, unknown>
    : {}
  const campos = aplicarDadosPessoaisDoCadastro(camposSalvos, camposFormulario, user)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/proponente/inscricoes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para detalhes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 break-words">Editar Inscrição</h1>
        <p className="text-sm text-slate-500 mt-1 break-words">
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
