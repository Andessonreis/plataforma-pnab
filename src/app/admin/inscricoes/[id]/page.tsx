import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { CRITERIOS_AVALIACAO_PADRAO, type CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { InscricaoStatus } from '@prisma/client'
import type { CampoFormulario } from '@/types/campo-formulario'
import { temAcessoEdital } from '@/lib/edital-acesso'
import { HabilitacaoActions } from './habilitacao-actions'
import { AvaliacaoForm } from './avaliacao-form'
import { RecursoDecision } from './recurso-decision'
import { AnexoViewer } from './anexo-viewer'
import { DistribuicaoAvaliadores } from './distribuicao-avaliadores'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import { formatNotaTotal, viewNotaTotal } from '@/lib/services/avaliacao-view'
import { podeAvaliar, podeHabilitar, podeAtribuirAvaliador, mensagemForaDaFase } from '@/lib/edital/fase'
import { ForaDaFaseAlert } from '@/components/edital/fora-da-fase-alert'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscrição ${id} — Admin PNAB` }
}

export default async function AdminInscricaoDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const userRole = session.user.role
  const isAvaliador = userRole === 'AVALIADOR'
  const isAdmin = userRole === 'ADMIN'

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: { select: { titulo: true, slug: true, ano: true, status: true, criteriosAvaliacao: true, camposFormulario: true, etapasCustomizadas: true, formulaAvaliacao: true } },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      avaliacoes: {
        include: { avaliador: { select: { nome: true } } },
        orderBy: { createdAt: 'asc' },
      },
      recursos: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!inscricao) notFound()

  // AVALIADOR acessa inscrições de editais onde é membro da equipe (ou todos, se sem equipe)
  if (isAvaliador) {
    const ok = await temAcessoEdital(session.user.id, inscricao.editalId, 'AVALIADOR')
    if (!ok) {
      redirect('/admin/inscricoes?aviso=nao-atribuido')
    }
  }

  // HABILITADOR só acessa inscrições de editais atribuídos
  if (userRole === 'HABILITADOR') {
    const ok = await temAcessoEdital(session.user.id, inscricao.editalId, 'HABILITADOR')
    if (!ok) {
      redirect('/admin/inscricoes?aviso=nao-atribuido')
    }
  }

  // Buscar avaliação do usuário atual (AVALIADOR ou ADMIN avaliando)
  const meuAvaliacao = (isAvaliador || isAdmin)
    ? await prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      select: {
        id: true,
        notas: true,
        parecer: true,
        notaTotal: true,
        finalizada: true,
        updatedAt: true,
      },
    })
    : null

  // Resolver critérios de avaliação
  const criteriosEdital = Array.isArray(inscricao.edital.criteriosAvaliacao)
    ? (inscricao.edital.criteriosAvaliacao as CriterioAvaliacao[])
    : []
  const criterios: CriterioAvaliacao[] =
    criteriosEdital.length > 0
      ? criteriosEdital
      : [...CRITERIOS_AVALIACAO_PADRAO]
  const hasFormula = !!inscricao.edital.formulaAvaliacao

  const rawCampos = inscricao.campos
  const campos: Record<string, unknown> =
    typeof rawCampos === 'string'
      ? (() => { try { return JSON.parse(rawCampos) } catch { return {} } })()
      : (rawCampos && typeof rawCampos === 'object' && !Array.isArray(rawCampos))
        ? (rawCampos as Record<string, unknown>)
        : {}
  const canHabilitar = session.user.role === 'ADMIN' || session.user.role === 'HABILITADOR'
  const isHabilitacaoStatus = inscricao.status === 'ENVIADA' || inscricao.status === 'HABILITADA' || inscricao.status === 'INABILITADA'

  // Gating por fase do edital — bugs #84/#85
  const editalStatus = inscricao.edital.status
  const podeAvaliarAgora = podeAvaliar(editalStatus)
  const podeHabilitarAgora = podeHabilitar(editalStatus)
  const podeAtribuirAgora = podeAtribuirAvaliador(editalStatus)

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas : []) as unknown as import('@/types/etapa-customizada').EtapaCustomizada[]
  const etapasOrdenadas = [...etapasCustomizadas].sort((a, b) => a.ordem - b.ordem)

  return (
    <section>
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <Link
            href="/admin/inscricoes"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
            {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{inscricao.numero}</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          {inscricao.edital.titulo} ({inscricao.edital.ano})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Coluna principal */}
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

          {/* Avaliacoes — visível apenas para ADMIN (avaliação cega entre avaliadores) */}
          {inscricao.avaliacoes.length > 0 && !isAvaliador && (
            <Card padding="sm" className="sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                Avaliações ({inscricao.avaliacoes.length})
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {inscricao.avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="p-3 sm:p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {avaliacao.avaliador.nome}
                      </span>
                      <div className="flex items-center gap-2">
                        {(avaliacao as unknown as { finalizada: boolean }).finalizada && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Finalizada
                          </span>
                        )}
                        <span className="text-xl font-bold text-brand-700 tabular-nums">
                          {formatNotaTotal(avaliacao, hasFormula ? 2 : 1)}
                          {viewNotaTotal(avaliacao) !== null && hasFormula ? ' pts' : ''}
                        </span>
                      </div>
                    </div>
                    {avaliacao.parecer && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed break-words">{avaliacao.parecer}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recursos */}
          {inscricao.recursos.length > 0 && (
            <Card padding="sm" className="sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Recursos</h2>
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
                      {new Date(recurso.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                    {/* Formulário de decisão para recursos pendentes */}
                    {!recurso.decisao && (isAdmin || userRole === 'HABILITADOR') && (
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

        {/* Coluna lateral — Ações */}
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
              {inscricao.notaFinal && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">{hasFormula ? 'Pontuação Final' : 'Nota Final'}</dt>
                  <dd className="text-2xl font-bold text-brand-700 tabular-nums">
                    {parseFloat(String(inscricao.notaFinal)).toFixed(hasFormula ? 2 : 1)}
                    {hasFormula && <span className="text-sm font-normal text-slate-400 ml-1">pts</span>}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Distribuição de avaliadores — ADMIN, gateado por fase */}
          {isAdmin && (inscricao.status === 'HABILITADA' || inscricao.status === 'EM_AVALIACAO') && (
            podeAtribuirAgora ? (
              <DistribuicaoAvaliadores
                inscricaoId={inscricao.id}
                editalId={inscricao.editalId}
                avaliacoes={inscricao.avaliacoes.map((a) => ({
                  avaliador: { id: a.avaliadorId, nome: a.avaliador.nome },
                  finalizada: a.finalizada,
                  notaTotal: viewNotaTotal(a),
                }))}
              />
            ) : (
              <ForaDaFaseAlert
                mensagem={mensagemForaDaFase(editalStatus, 'atribuir_avaliador')}
                isAdmin={isAdmin}
              >
                <DistribuicaoAvaliadores
                  inscricaoId={inscricao.id}
                  editalId={inscricao.editalId}
                  avaliacoes={inscricao.avaliacoes.map((a) => ({
                    avaliador: { id: a.avaliadorId, nome: a.avaliador.nome },
                    finalizada: a.finalizada,
                    notaTotal: viewNotaTotal(a),
                  }))}
                />
              </ForaDaFaseAlert>
            )
          )}

          {/* Formulário de avaliação — AVALIADOR e ADMIN, gateado por fase */}
          {(isAvaliador || isAdmin) && (() => {
            const formProps = {
              inscricaoId: inscricao.id,
              inscricaoNumero: inscricao.numero,
              criterios,
              initialAvaliacao: meuAvaliacao
                ? {
                  id: meuAvaliacao.id,
                  notas: meuAvaliacao.notas as { criterio: string; nota: number; peso: number }[],
                  parecer: meuAvaliacao.parecer,
                  notaTotal: meuAvaliacao.notaTotal === null ? null : String(meuAvaliacao.notaTotal),
                  finalizada: meuAvaliacao.finalizada,
                  updatedAt: meuAvaliacao.updatedAt.toISOString(),
                }
                : null,
              isAdmin,
              formulaAvaliacao: inscricao.edital.formulaAvaliacao,
            }

            if (podeAvaliarAgora) {
              return <AvaliacaoForm {...formProps} />
            }
            return (
              <ForaDaFaseAlert
                mensagem={mensagemForaDaFase(editalStatus, 'avaliar')}
                isAdmin={isAdmin}
              >
                <AvaliacaoForm {...formProps} overrideMode />
              </ForaDaFaseAlert>
            )
          })()}

          {/* Habilitação — gateado por fase */}
          {canHabilitar && isHabilitacaoStatus && (
            podeHabilitarAgora ? (
              <HabilitacaoActions
                inscricaoId={inscricao.id}
                currentStatus={inscricao.status as InscricaoStatus}
                motivoAtual={inscricao.motivoInabilitacao ?? ''}
              />
            ) : (
              <ForaDaFaseAlert
                mensagem={mensagemForaDaFase(editalStatus, 'habilitar')}
                isAdmin={isAdmin}
              >
                <HabilitacaoActions
                  inscricaoId={inscricao.id}
                  currentStatus={inscricao.status as InscricaoStatus}
                  motivoAtual={inscricao.motivoInabilitacao ?? ''}
                  overrideMode
                />
              </ForaDaFaseAlert>
            )
          )}

          {/* Motivo inabilitação */}
          {inscricao.motivoInabilitacao && (
            <Card padding="sm" className="sm:p-6 border-red-200 bg-red-50">
              <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Motivo da Inabilitação</h2>
              <p className="text-sm text-red-700 break-words">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
