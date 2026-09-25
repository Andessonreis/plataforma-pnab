import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { requireRole } from '../../require-role'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { prisma } from '@/lib/db'
import { IconArrowLeft } from '@/components/ui'
import type { InscricaoStatus } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { AnexoViewer } from '../../inscricoes/[id]/anexo-viewer'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import { calcularAnexosPendentes } from '@/lib/inscricoes/anexos-pendentes'
import { podeHabilitar } from '@/lib/edital/fase'
import { STATUS_HABILITACAO } from '../constantes'
import { AvisoEspelho } from '../aviso-espelho'
import { resolverVisaoHabilitacao } from '../visao-habilitacao'
import { filtrarConteudoSensivel } from './conteudo-sensivel'
import { CabecalhoInscricao } from './cabecalho-inscricao'
import { RecursosHabilitacao } from './recursos-habilitacao'
import { LateralInscricao } from './lateral-inscricao'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editalId?: string; aba?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Habilitação ${id} — Portal PNAB Irecê` }
}

/** `campos` chega como objeto, ou como texto JSON em inscrições antigas. */
function lerCampos(bruto: unknown): Record<string, unknown> {
  if (typeof bruto === 'string') {
    try {
      return JSON.parse(bruto)
    } catch {
      return {}
    }
  }
  return bruto && typeof bruto === 'object' && !Array.isArray(bruto) ? (bruto as Record<string, unknown>) : {}
}

export default async function AdminHabilitacaoDetailPage({ params, searchParams }: Props) {
  const session = await requireRole('HABILITADOR', 'ADMIN')
  const { escopoId, espelho } = await resolverVisaoHabilitacao(session)

  const { id } = await params
  const { editalId, aba } = await searchParams

  const voltarHref = (() => {
    if (!editalId) return '/admin/habilitacao'
    const sp = new URLSearchParams()
    sp.set('editalId', editalId)
    if (aba) sp.set('aba', aba)
    return `/admin/habilitacao?${sp.toString()}`
  })()

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: {
        select: {
          titulo: true,
          ano: true,
          status: true,
          camposFormulario: true,
          etapasCustomizadas: true,
          tiposAnexo: true,
        },
      },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      recursos: {
        where: { fase: 'HABILITACAO' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!inscricao) notFound()

  // Habilitador só entra em inscrição de edital atribuído a ele — mesmo
  // resultado do não encontrado, não vaza que o edital existe.
  if (escopoId) {
    const visiveis = await getEditaisVisiveis(escopoId, 'HABILITADOR')
    if (visiveis && !visiveis.includes(inscricao.editalId)) notFound()
  }

  if (!STATUS_HABILITACAO.includes(inscricao.status as InscricaoStatus)) {
    redirect(`/admin/inscricoes/${inscricao.id}`)
  }

  const podeHabilitarAgora = podeHabilitar(inscricao.edital.status)

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario
    : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas
    : []) as unknown as EtapaCustomizada[]

  // Só o SUPER_ADMIN vê o conteúdo de mérito aqui (o AVALIADOR enxerga pela tela
  // de avaliação). No espelho ele vê como o habilitador, então também fica sem.
  // Documentos previstos e não enviados entram como "Não informado", com o mesmo filtro.
  const podeVerConteudoSensivel = session.user.role === 'SUPER_ADMIN' && !espelho
  const {
    etapas: etapasOrdenadas,
    anexos: anexosVisiveis,
    pendentes: anexosPendentes,
  } = filtrarConteudoSensivel(
    {
      etapas: [...etapasCustomizadas].sort((a, b) => a.ordem - b.ordem),
      anexos: inscricao.anexos,
      pendentes: calcularAnexosPendentes(inscricao.edital.tiposAnexo, inscricao.anexos),
    },
    podeVerConteudoSensivel,
  )

  return (
    <section>
      <AvisoEspelho nome={espelho} />

      {/* Voltar */}
      <Link
        href={voltarHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium mb-4"
      >
        <IconArrowLeft className="h-4 w-4" />
        Voltar para habilitação
      </Link>

      <CabecalhoInscricao
        numero={inscricao.numero}
        status={inscricao.status}
        editalTitulo={inscricao.edital.titulo}
        editalAno={inscricao.edital.ano}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Coluna principal — dados + anexos */}
        <div className="lg:col-span-2 xl:col-span-8 2xl:col-span-9 space-y-4 sm:space-y-6">
          <DadosInscricaoView
            proponente={inscricao.proponente}
            categoria={inscricao.categoria}
            campos={lerCampos(inscricao.campos)}
            camposFormulario={camposFormulario}
            etapasCustomizadas={etapasOrdenadas}
            anexos={
              anexosVisiveis.length > 0 || anexosPendentes.length > 0
                ? {
                    count: anexosVisiveis.length,
                    node: (
                      <AnexoViewer
                        inscricaoId={inscricao.id}
                        anexos={anexosVisiveis.map((a) => ({
                          id: a.id,
                          tipo: a.tipo,
                          titulo: a.titulo,
                          valido: a.valido,
                          observacao: a.observacao,
                        }))}
                        pendentes={anexosPendentes}
                      />
                    ),
                  }
                : undefined
            }
          />

          {/* Recursos de habilitação (se houver) */}
          {inscricao.recursos.length > 0 && (
            <RecursosHabilitacao
              inscricaoId={inscricao.id}
              recursos={inscricao.recursos}
              podeDecidir={podeHabilitarAgora}
              somenteLeitura={espelho !== null}
            />
          )}
        </div>

        <LateralInscricao
          inscricao={{
            id: inscricao.id,
            numero: inscricao.numero,
            status: inscricao.status,
            submittedAt: inscricao.submittedAt,
            motivoInabilitacao: inscricao.motivoInabilitacao,
            totalAnexos: inscricao.anexos.length,
          }}
          podeHabilitarAgora={podeHabilitarAgora}
          somenteLeitura={espelho !== null}
        />
      </div>
    </section>
  )
}
