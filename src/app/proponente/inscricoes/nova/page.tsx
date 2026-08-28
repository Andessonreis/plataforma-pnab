import type { Metadata } from 'next'
import { AvisoRetificacao } from '@/components/edital/faixa-retificacao'
import { retificacaoVigente } from '@/lib/utils/retificacao'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import InscricaoForm from './inscricao-form'
import { NovaInscricaoHeader } from './nova-inscricao-header'
import { InscricaoNaoPermitida } from './inscricao-nao-permitida'
import { aplicarDadosPessoaisDoCadastro } from './dados-pessoais-cadastro'
import type { CampoFormulario } from '@/types/campo-formulario'

export const metadata: Metadata = {
  title: 'Nova Inscrição — Portal PNAB Irecê',
}

const TIPO_PROPONENTE_LABELS: Record<string, string> = {
  PF: 'Pessoa Física',
  MEI: 'MEI',
  PJ: 'Pessoa Jurídica',
  COLETIVO: 'Coletivo',
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
      slug: true,
      titulo: true,
      categorias: true,
      categoriasConfig: true,
      camposFormulario: true,
      etapasCustomizadas: true,
      tiposAnexo: true,
      tiposProponentePermitidos: true,
      status: true,
      videoHabilitado: true,
      retificacoes: true,
      arquivos: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, tipo: true, titulo: true, url: true, acessivel: true },
      },
    },
  })

  if (!edital || edital.status !== 'INSCRICOES_ABERTAS') {
    redirect('/editais')
  }

  // Mapa tipo→label para exibir labels humanos nos badges dos arquivos do edital
  const tipoLabels: Record<string, string> = {}
  if (edital.arquivos.length > 0) {
    const tiposUsados = [...new Set(edital.arquivos.map((a) => a.tipo))]
    const attachmentTypes = await prisma.attachmentType.findMany({
      where: { tipo: { in: tiposUsados } },
      select: { tipo: true, label: true },
    })
    for (const at of attachmentTypes) {
      tipoLabels[at.tipo] = at.label
    }
  }

  // Buscar dados do usuário (tipo de proponente + dados pessoais pra pré-preencher o formulário)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipoProponente: true, nome: true, email: true, telefone: true },
  })

  // Verificar elegibilidade por tipo de proponente
  const tiposPermitidos = edital.tiposProponentePermitidos as string[]
  if (tiposPermitidos.length > 0 && (!user?.tipoProponente || !tiposPermitidos.includes(user.tipoProponente))) {
    const tiposTexto = tiposPermitidos.map((t) => TIPO_PROPONENTE_LABELS[t] || t).join(', ')
    return <InscricaoNaoPermitida editalTitulo={edital.titulo} tiposTexto={tiposTexto} />
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

  // Pré-preenche campos de dados pessoais com o que já foi capturado no cadastro
  // (o proponente pode editar livremente) — só quando o edital define um campo
  // com esses nomes convencionados.
  const initialCampos = aplicarDadosPessoaisDoCadastro({}, camposFormulario, user)
  const retificacaoAtual = retificacaoVigente(edital.retificacoes)

  return (
    <div className="space-y-6">
      <NovaInscricaoHeader editalTitulo={edital.titulo} />

      {/* O prazo alterado precisa alcançar quem está começando a inscrição
          agora, não só quem visita a página pública do edital. */}
      {retificacaoAtual && <AvisoRetificacao retificacao={retificacaoAtual} />}

      <InscricaoForm
        edital={{
          id: edital.id,
          slug: edital.slug,
          titulo: edital.titulo,
          categorias: edital.categorias,
          categoriasConfig: (Array.isArray(edital.categoriasConfig)
            ? edital.categoriasConfig : null) as unknown as import('@/types/categoria-config').CategoriaConfig[] | null,
          camposFormulario: camposFormulario as unknown as CampoFormulario[],
          etapasCustomizadas: (Array.isArray(edital.etapasCustomizadas)
            ? (edital.etapasCustomizadas as unknown as import('@/types/etapa-customizada').EtapaCustomizada[])
            : []),
          tiposAnexo: Array.isArray(edital.tiposAnexo)
            ? (edital.tiposAnexo as Array<{ tipo: string; label: string; obrigatorio: boolean }>)
            : null,
          arquivos: edital.arquivos,
          tipoLabels,
          videoHabilitado: edital.videoHabilitado,
        }}
        tipoProponente={user?.tipoProponente ?? null}
        initialCampos={initialCampos}
      />
    </div>
  )
}
