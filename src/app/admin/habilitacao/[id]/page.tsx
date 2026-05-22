import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { requireRole } from '../../require-role'
import { prisma } from '@/lib/db'
import { Card, Badge, IconArrowLeft, IconShield } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { HabilitacaoActions } from '../../inscricoes/[id]/habilitacao-actions'
import { AnexoViewer } from '../../inscricoes/[id]/anexo-viewer'
import { RecursoDecision } from '../../inscricoes/[id]/recurso-decision'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import { podeHabilitar, mensagemForaDaFase } from '@/lib/edital/fase'
import { ForaDaFaseAlert } from '@/components/edital/fora-da-fase-alert'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Habilitação ${id} — Admin PNAB` }
}

const STATUSES_HABILITACAO: InscricaoStatus[] = ['ENVIADA', 'HABILITADA', 'INABILITADA']

export default async function AdminHabilitacaoDetailPage({ params }: Props) {
  await requireRole('ADMIN')

  const { id } = await params

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

  // Se o status da inscrição não é de habilitação, redireciona pra tela de inscrições
  // (essa página é focada exclusivamente em conferência documental)
  if (!STATUSES_HABILITACAO.includes(inscricao.status as InscricaoStatus)) {
    redirect(`/admin/inscricoes/${inscricao.id}`)
  }

  const rawCampos = inscricao.campos
  const campos: Record<string, unknown> =
    typeof rawCampos === 'string'
      ? (() => {
          try {
            return JSON.parse(rawCampos)
          } catch {
            return {}
          }
        })()
      : rawCampos && typeof rawCampos === 'object' && !Array.isArray(rawCampos)
        ? (rawCampos as Record<string, unknown>)
        : {}

  const editalStatus = inscricao.edital.status
  const podeHabilitarAgora = podeHabilitar(editalStatus)

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario
    : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas
    : []) as unknown as EtapaCustomizada[]
  const etapasOrdenadas = [...etapasCustomizadas].sort((a, b) => a.ordem - b.ordem)

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <Link
            href="/admin/habilitacao"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            <IconArrowLeft className="h-4 w-4" />
            Voltar para Habilitação
          </Link>
          <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
            {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <IconShield className="h-5 w-5 text-brand-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{inscricao.numero}</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          {inscricao.edital.titulo} ({inscricao.edital.ano})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Coluna principal — dados + anexos */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <DadosInscricaoView
            proponente={inscricao.proponente}
            categoria={inscricao.categoria}
            campos={campos}
            camposFormulario={camposFormulario}
            etapasCustomizadas={etapasOrdenadas}
            anexos={
              inscricao.anexos.length > 0
                ? {
                    count: inscricao.anexos.length,
                    node: (
                      <AnexoViewer
                        inscricaoId={inscricao.id}
                        anexos={inscricao.anexos.map((a) => ({
                          id: a.id,
                          tipo: a.tipo,
                          titulo: a.titulo,
                          valido: a.valido,
                          observacao: a.observacao,
                        }))}
                      />
                    ),
                  }
                : undefined
            }
          />

          {/* Recursos de habilitação (se houver) */}
          {inscricao.recursos.length > 0 && (
            <Card padding="sm" className="sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                Recursos de habilitação
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {inscricao.recursos.map((recurso) => (
                  <div key={recurso.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="info">{recurso.fase}</Badge>
                      {recurso.decisao && (
                        <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                          {recurso.decisao}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-2 break-words">{recurso.texto}</p>
                    {recurso.justificativa && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">Justificativa:</p>
                        <p className="text-sm text-slate-700 break-words">{recurso.justificativa}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(recurso.createdAt).toLocaleDateString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                      })}
                    </p>
                    {!recurso.decisao && (
                      <div className="mt-3">
                        <RecursoDecision
                          inscricaoId={inscricao.id}
                          recursoId={recurso.id}
                          fase={recurso.fase}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna lateral — Ações de habilitação */}
        <div className="space-y-4 sm:space-y-6">
          {/* Resumo */}
          <Card padding="sm" className="sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Resumo</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Número</dt>
                <dd className="text-sm text-slate-900 font-mono">{inscricao.numero}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Enviada em</dt>
                <dd className="text-sm text-slate-900">
                  {inscricao.submittedAt
                    ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'America/Sao_Paulo',
                      })
                    : 'Não enviada'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Documentos enviados</dt>
                <dd className="text-sm text-slate-900">{inscricao.anexos.length}</dd>
              </div>
            </dl>
          </Card>

          {/* Ações de habilitação */}
          {podeHabilitarAgora ? (
            <HabilitacaoActions
              inscricaoId={inscricao.id}
              currentStatus={inscricao.status as InscricaoStatus}
              motivoAtual={inscricao.motivoInabilitacao ?? ''}
            />
          ) : (
            <ForaDaFaseAlert
              mensagem={mensagemForaDaFase(editalStatus, 'habilitar')}
              isAdmin
            >
              <HabilitacaoActions
                inscricaoId={inscricao.id}
                currentStatus={inscricao.status as InscricaoStatus}
                motivoAtual={inscricao.motivoInabilitacao ?? ''}
                overrideMode
              />
            </ForaDaFaseAlert>
          )}

          {/* Motivo inabilitação */}
          {inscricao.motivoInabilitacao && (
            <Card padding="sm" className="sm:p-6 border-red-200 bg-red-50">
              <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                Motivo da Inabilitação
              </h2>
              <p className="text-sm text-red-700 break-words">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
