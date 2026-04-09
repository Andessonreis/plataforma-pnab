import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui/icons'
import InscricaoForm from './inscricao-form'
import type { CampoFormulario } from '@/types/campo-formulario'

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
      tiposAnexo: true,
      tiposProponentePermitidos: true,
      status: true,
    },
  })

  if (!edital || edital.status !== 'INSCRICOES_ABERTAS') {
    redirect('/editais')
  }

  // Buscar tipo de proponente do usuário
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipoProponente: true },
  })

  // Verificar elegibilidade por tipo de proponente
  const tiposPermitidos = edital.tiposProponentePermitidos as string[]
  if (tiposPermitidos.length > 0 && (!user?.tipoProponente || !tiposPermitidos.includes(user.tipoProponente))) {
    const tipoLabels: Record<string, string> = { PF: 'Pessoa Física', MEI: 'MEI', PJ: 'Pessoa Jurídica', COLETIVO: 'Coletivo' }
    const tiposTexto = tiposPermitidos.map(t => tipoLabels[t] || t).join(', ')
    return (
      <div className="space-y-6">
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
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-amber-800">Inscrição não permitida</h2>
              <p className="text-sm text-amber-700 mt-1">
                Este edital aceita apenas inscrições de <strong>{tiposTexto}</strong>.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Seu cadastro atual não corresponde aos tipos aceitos. Se acredita que houve um erro,
                entre em contato com a Secretaria de Arte e Cultura de Irecê.
              </p>
              <Link
                href="/proponente/perfil"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Ver meu perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          camposFormulario: camposFormulario as unknown as CampoFormulario[],
          tiposAnexo: Array.isArray(edital.tiposAnexo)
            ? (edital.tiposAnexo as Array<{ tipo: string; label: string; obrigatorio: boolean }>)
            : null,
        }}
        tipoProponente={user?.tipoProponente ?? null}
      />
    </div>
  )
}
