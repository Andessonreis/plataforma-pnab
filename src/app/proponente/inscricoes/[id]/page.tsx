import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { respostaRecursoLiberada } from '@/lib/edital/fase'
import { RecursoAnexos } from '@/components/recurso/recurso-anexos'
import type { InscricaoStatus } from '@prisma/client'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import { RecursoForm } from './recurso/recurso-form'
import { RetractAndEditButton } from './retract-and-edit-button'
import { formatNotaTotal } from '@/lib/services/avaliacao-view'
import { janelaParaAcao, mensagemJanela } from '@/lib/utils/cronograma-janela'
import type { AcaoJanela } from '@/types/cronograma'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enviada?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscrição ${id} — Portal PNAB Irecê` }
}

// Timeline de status: a ordem esperada pelo fluxo
const statusTimeline: InscricaoStatus[] = [
  'RASCUNHO',
  'ENVIADA',
  'HABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RESULTADO_FINAL',
]

// Status do edital em que as notas/avaliacoes podem ser exibidas ao proponente
const RESULTADO_VISIVEL = ['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO']

export default async function InscricaoDetailPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { enviada } = await searchParams

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: {
        select: {
          titulo: true, slug: true, ano: true, categorias: true, status: true,
          formulaAvaliacao: true, camposFormulario: true, etapasCustomizadas: true,
          cronograma: true,
        },
      },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      avaliacoes: {
        // Proponente só vê avaliações finalizadas — rascunhos e placeholders
        // não devem expor "0" como se fosse nota recebida (bug #66).
        where: { finalizada: true },
        select: { notaTotal: true, parecer: true, finalizada: true, createdAt: true },
      },
      recursos: {
        select: {
          id: true,
          fase: true,
          texto: true,
          urlAnexos: true,
          decisao: true,
          justificativa: true,
          createdAt: true,
          respostas: {
            select: {
              decisao: true,
              justificativa: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  // Verificar que pertence ao usuario
  if (!inscricao || inscricao.proponenteId !== session.user.id) {
    notFound()
  }

  // Status terminais (CONTEMPLADA, NAO_CONTEMPLADA, SUPLENTE, RECURSO_ABERTO)
  // já passaram por toda a timeline — mapear para posição correta
  const statusIndexMap: Partial<Record<InscricaoStatus, number>> = {
    CONTEMPLADA: statusTimeline.length,
    NAO_CONTEMPLADA: statusTimeline.length,
    SUPLENTE: statusTimeline.length,
    INABILITADA: 1, // Passou por RASCUNHO e ENVIADA, mas não por HABILITADA
    RECURSO_ABERTO: statusTimeline.indexOf('RESULTADO_PRELIMINAR'),
  }
  const currentStatusIndex = statusIndexMap[inscricao.status as InscricaoStatus]
    ?? statusTimeline.indexOf(inscricao.status as InscricaoStatus)
  // Parsear campos com segurança — Prisma Json pode retornar string em vez de objeto
  let camposParsed = inscricao.campos
  if (typeof camposParsed === 'string') {
    try { camposParsed = JSON.parse(camposParsed) } catch { camposParsed = {} }
  }
  const campos = (camposParsed && typeof camposParsed === 'object' && !Array.isArray(camposParsed))
    ? camposParsed as Record<string, unknown>
    : {} as Record<string, unknown>

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas : []) as unknown as EtapaCustomizada[]

  const mostrarSucesso = enviada === 'true' && inscricao.status === 'ENVIADA'

  return (
    <section>
      {/* Banner de sucesso pós-submissão */}
      {mostrarSucesso && (
        <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <svg className="h-8 w-8 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-emerald-800">Inscrição enviada com sucesso!</h2>
              <p className="text-sm text-emerald-700 mt-2">
                Seu número de protocolo:
              </p>
              <p className="text-2xl font-mono font-bold text-emerald-900 mt-1">{inscricao.numero}</p>
              {inscricao.submittedAt && (
                <p className="text-sm text-emerald-600 mt-2">
                  Enviada em {new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                  })}
                </p>
              )}
              <div className="mt-4 p-3 bg-emerald-100 rounded-md">
                <p className="text-sm text-emerald-800 font-medium">Próximos passos:</p>
                <ul className="text-sm text-emerald-700 mt-1 list-disc list-inside space-y-1">
                  <li>Você receberá um e-mail de confirmação</li>
                  <li>Aguarde a fase de habilitação para verificação dos documentos</li>
                  <li>Acompanhe o andamento da sua inscrição nesta página</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href={`/api/proponente/inscricoes/${inscricao.id}/comprovante`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Baixar Comprovante (PDF)
                </a>
                <Link
                  href="/proponente/inscricoes"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors min-h-[44px]"
                >
                  Voltar para minhas inscrições
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabecalho — #81: flex-wrap + min-w-0 evitam horizontal overflow
          em viewports estreitos quando título do edital + label do status
          são longos */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div className="min-w-0 flex-1">
          <Link
            href="/proponente/inscricoes"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 break-words">Inscrição {inscricao.numero}</h1>
          <p className="text-slate-600 mt-1 break-words">{inscricao.edital.titulo} ({inscricao.edital.ano})</p>
        </div>
        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]} className="text-sm px-3 py-1">
          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
        </Badge>
      </div>

      {/* Timeline de status */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Andamento</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {statusTimeline.map((status, i) => {
            const isPast = i <= currentStatusIndex
            const isCurrent = status === inscricao.status
            return (
              <div key={status} className="flex items-center">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div
                    className={[
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                      isCurrent
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : isPast
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-slate-100 text-slate-400',
                    ].join(' ')}
                  >
                    {isPast && !isCurrent ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>
                    {inscricaoStatusLabel[status]}
                  </span>
                </div>
                {i < statusTimeline.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${i < currentStatusIndex ? 'bg-brand-300' : 'bg-slate-200'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados da inscricao */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações gerais */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações Gerais</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Número</dt>
                <dd className="text-sm text-slate-900 font-mono">{inscricao.numero}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Categoria</dt>
                <dd className="text-sm text-slate-900">{inscricao.categoria ?? 'Não informada'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Data de Envio</dt>
                <dd className="text-sm text-slate-900">
                  {inscricao.submittedAt
                    ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo',
                      })
                    : 'Não enviada'}
                </dd>
              </div>
              {RESULTADO_VISIVEL.includes(inscricao.edital.status) && inscricao.notaFinal && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">{inscricao.edital.formulaAvaliacao ? 'Pontuação Final' : 'Nota Final'}</dt>
                  <dd className="text-sm text-slate-900 font-bold">
                    {Number(inscricao.notaFinal).toFixed(2)}{inscricao.edital.formulaAvaliacao ? ' pts' : ''}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Dados preenchidos: proponente + campos + etapas customizadas (accordion) */}
          <DadosInscricaoView
            proponente={inscricao.proponente}
            categoria={inscricao.categoria}
            campos={campos}
            camposFormulario={camposFormulario}
            etapasCustomizadas={etapasCustomizadas}
          />

          {/* Anexos */}
          {inscricao.anexos.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Anexos</h2>
              <ul className="space-y-2">
                {inscricao.anexos.map((anexo) => (
                  <li key={anexo.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
                      <p className="text-xs text-slate-500">{anexo.tipo}</p>
                    </div>
                    {anexo.valido !== null && (
                      <Badge variant={anexo.valido ? 'success' : 'error'}>
                        {anexo.valido ? 'Válido' : 'Inválido'}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Motivo inabilitação */}
          {inscricao.motivoInabilitacao && (
            <Card className="border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Motivo da Inabilitação</h2>
              <p className="text-sm text-red-700 break-words">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>

        {/* Sidebar — avaliações e recursos */}
        <div className="space-y-6">
          {/* Avaliações */}
          {RESULTADO_VISIVEL.includes(inscricao.edital.status) && inscricao.avaliacoes.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Avaliações</h2>
              <div className="space-y-3">
                {inscricao.avaliacoes.map((avaliacao, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">Avaliação {i + 1}</span>
                      <span className="text-lg font-bold text-brand-700">{formatNotaTotal(avaliacao)}</span>
                    </div>
                    {avaliacao.parecer && (
                      <p className="text-xs text-slate-500 mt-1 break-words">{avaliacao.parecer}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recursos */}
          {inscricao.recursos.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recursos</h2>
              <div className="space-y-3">
                {inscricao.recursos.map((recurso, i) => {
                  const liberada = respostaRecursoLiberada(recurso.fase, inscricao.edital.status)
                  return (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">{recurso.fase}</span>
                      {recurso.decisao && liberada ? (
                        <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                          {recurso.decisao}
                        </Badge>
                      ) : (
                        <Badge variant="warning">Em análise</Badge>
                      )}
                    </div>
                    {recurso.texto && (
                      <p className="text-xs text-slate-700 mt-1 mb-1 whitespace-pre-wrap break-words">{recurso.texto}</p>
                    )}
                    {recurso.urlAnexos && recurso.urlAnexos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-1">Evidências</p>
                        <RecursoAnexos
                          urls={recurso.urlAnexos}
                          inscricaoId={inscricao.id}
                          recursoId={recurso.id}
                          scope="proponente"
                        />
                      </div>
                    )}
                    {recurso.justificativa && liberada && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-0.5">Decisão da comissão</p>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{recurso.justificativa}</p>
                      </div>
                    )}

                    {/* Respostas individuais (considerações dos avaliadores) — #producao: nomes ocultos */}
                    {liberada && recurso.respostas && recurso.respostas.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200 space-y-3">
                        <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">Considerações dos avaliadores</p>
                        {recurso.respostas.map((resp, idx) => (
                          <div key={idx} className="bg-white/50 p-2 rounded border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Avaliador {idx + 1}</span>
                              <Badge variant={resp.decisao === 'DEFERIDO' ? 'success' : 'error'} className="text-[9px] px-1.5 py-0">
                                {resp.decisao}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 italic whitespace-pre-wrap break-words">
                              "{resp.justificativa}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Enviado em {new Date(recurso.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Interpor Recurso — gateado por status + janela do cronograma */}
          {['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE'].includes(inscricao.status) && (() => {
            const fase =
              inscricao.status === 'INABILITADA' ? 'HABILITACAO' :
              inscricao.status === 'RESULTADO_PRELIMINAR' ? 'RESULTADO_PRELIMINAR' :
              'RESULTADO_FINAL'

            const acaoJanela: AcaoJanela | null =
              fase === 'HABILITACAO' ? 'RECURSO_HABILITACAO_JANELA' :
              fase === 'RESULTADO_PRELIMINAR' ? 'RECURSO_RESULTADO_JANELA' :
              null

            const janelaInfo = acaoJanela
              ? janelaParaAcao(inscricao.edital.cronograma, acaoJanela)
              : null

            // Se tem janela configurada e não está ativa, mostra alerta no lugar do form
            if (janelaInfo && !janelaInfo.ativa) {
              const titulo = janelaInfo.status === 'antes' ? 'Recurso ainda não disponível' : 'Período de recurso encerrado'
              return (
                <Card>
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
                      <p className="text-xs text-slate-600 mt-1">{mensagemJanela(janelaInfo)}.</p>
                    </div>
                  </div>
                </Card>
              )
            }

            return (
              <Card>
                {janelaInfo?.ativa && (
                  <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                    {mensagemJanela(janelaInfo)}.
                  </div>
                )}
                <RecursoForm
                  inscricaoId={inscricao.id}
                  fase={fase}
                  contexto={{
                    entidadeNome: inscricao.proponente.nome,
                    projetoNome: inscricao.numero,
                    responsavelNome: inscricao.proponente.nome,
                  }}
                />
              </Card>
            )
          })()}

          {/* Documentos */}
          {inscricao.status !== 'RASCUNHO' && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Documentos</h2>
              <div className="space-y-2">
                <a
                  href={`/api/proponente/inscricoes/${inscricao.id}/comprovante`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors min-h-[44px]"
                  download
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Baixar Comprovante (PDF)
                </a>
                <a
                  href={`/api/proponente/inscricoes/${inscricao.id}/projeto-pdf`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                  download
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Exportar Projeto Completo (PDF)
                </a>
              </div>
            </Card>
          )}

          {/* Ações */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações</h2>
            <div className="space-y-2">
              {inscricao.status === 'RASCUNHO' && (
                <Link
                  href={`/proponente/inscricoes/${inscricao.id}/editar`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Inscrição
                </Link>
              )}
              {inscricao.status === 'ENVIADA' && inscricao.edital.status === 'INSCRICOES_ABERTAS' && (
                <RetractAndEditButton inscricaoId={inscricao.id} />
              )}
              <Link
                href={`/proponente/inscricoes`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                Voltar para Lista
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
