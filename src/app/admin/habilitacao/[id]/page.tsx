import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { requireRole } from '../../require-role'
import { prisma } from '@/lib/db'
import { Card, Badge, IconArrowLeft, IconShield, IconClock } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { HabilitacaoActions } from '../../inscricoes/[id]/habilitacao-actions'
import { AnexoViewer } from '../../inscricoes/[id]/anexo-viewer'
import { RecursoDecision } from '../../inscricoes/[id]/recurso-decision'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import { podeHabilitar } from '@/lib/edital/fase'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Habilitação ${id} — Portal PNAB Irecê` }
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

  const podeHabilitarAgora = podeHabilitar(inscricao.edital.status)

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario
    : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas
    : []) as unknown as EtapaCustomizada[]
  const etapasOrdenadas = [...etapasCustomizadas].sort((a, b) => a.ordem - b.ordem)

  return (
    <section>
      {/* Voltar */}
      <Link
        href="/admin/habilitacao"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium mb-4"
      >
        <IconArrowLeft className="h-4 w-4" />
        Voltar para habilitação
      </Link>

      {/* Cabeçalho institucional */}
      <header className="mb-6 sm:mb-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
            <IconShield className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight font-mono">
                {inscricao.numero}
              </h1>
              <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-slate-600">
              {inscricao.edital.titulo} <span className="text-slate-400">·</span> {inscricao.edital.ano}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Coluna principal — dados + anexos */}
        <div className="lg:col-span-2 xl:col-span-8 2xl:col-span-9 space-y-4 sm:space-y-6">
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
                Recursos de habilitação ({inscricao.recursos.length})
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
                    {!recurso.decisao && podeHabilitarAgora && (
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

        {/* Coluna lateral */}
        <aside className="xl:col-span-4 2xl:col-span-3 space-y-4 sm:space-y-6">
          {/* Resumo */}
          <Card padding="sm" className="sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Resumo
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">Número</dt>
                <dd className="text-slate-900 font-mono mt-0.5">{inscricao.numero}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Enviada em</dt>
                <dd className="text-slate-900 mt-0.5">
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
                <dt className="text-xs font-medium text-slate-500">Documentos enviados</dt>
                <dd className="text-slate-900 mt-0.5">
                  {inscricao.anexos.length} {inscricao.anexos.length === 1 ? 'documento' : 'documentos'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Ações de habilitação — só quando edital está na fase HABILITACAO */}
          {podeHabilitarAgora ? (
            <HabilitacaoActions
              inscricaoId={inscricao.id}
              currentStatus={inscricao.status as InscricaoStatus}
              motivoAtual={inscricao.motivoInabilitacao ?? ''}
            />
          ) : (
            <Card padding="sm" className="sm:p-6 border-slate-200 bg-slate-50/60">
              <div className="flex items-start gap-2.5">
                <IconClock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">
                    Fora da fase de habilitação
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    A habilitação só pode ser registrada enquanto o edital estiver na fase de
                    habilitação. Aguarde a abertura da fase para conferir e decidir.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Motivo da inabilitação — quando já existe */}
          {inscricao.motivoInabilitacao && (
            <Card padding="sm" className="sm:p-6 border-rose-200 bg-rose-50">
              <h2 className="text-sm font-semibold text-rose-900 uppercase tracking-wider mb-2">
                Motivo da inabilitação
              </h2>
              <p className="text-sm text-rose-800 break-words leading-relaxed">
                {inscricao.motivoInabilitacao}
              </p>
            </Card>
          )}
        </aside>
      </div>
    </section>
  )
}
