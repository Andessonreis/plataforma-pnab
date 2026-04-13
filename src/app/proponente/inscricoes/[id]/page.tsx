import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import { RecursoForm } from './recurso/recurso-form'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enviada?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscricao ${id} — Portal PNAB Irece` }
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

// Labels legíveis para campos dinâmicos conhecidos
const campoLabels: Record<string, string> = {
  nomeProjeto: 'Nome do Projeto',
  descricao: 'Descrição',
  valorSolicitado: 'Valor Solicitado',
}

export default async function InscricaoDetailPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { enviada } = await searchParams

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: { select: { titulo: true, slug: true, ano: true, categorias: true, status: true } },
      anexos: true,
      avaliacoes: {
        select: { notaTotal: true, parecer: true, createdAt: true },
      },
      recursos: {
        select: { fase: true, decisao: true, justificativa: true, createdAt: true },
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

      {/* Cabecalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/proponente/inscricoes"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Inscricao {inscricao.numero}</h1>
          <p className="text-slate-600 mt-1">{inscricao.edital.titulo} ({inscricao.edital.ano})</p>
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
          {/* Informacoes gerais */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Informacoes Gerais</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Numero</dt>
                <dd className="text-sm text-slate-900 font-mono">{inscricao.numero}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Categoria</dt>
                <dd className="text-sm text-slate-900">{inscricao.categoria ?? 'Nao informada'}</dd>
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
                    : 'Nao enviada'}
                </dd>
              </div>
              {RESULTADO_VISIVEL.includes(inscricao.edital.status) && inscricao.notaFinal && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Nota Final</dt>
                  <dd className="text-sm text-slate-900 font-bold">{String(inscricao.notaFinal)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Campos preenchidos */}
          {Object.keys(campos).length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Dados da Proposta</h2>
              <dl className="space-y-3">
                {Object.entries(campos).map(([key, value]) => {
                  // Label legível para campos conhecidos
                  const label = campoLabels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim()
                  // Formatar valor monetário
                  const isValor = key.toLowerCase().includes('valor')
                  const raw = typeof value === 'string' ? value : JSON.stringify(value)
                  const display = isValor && !isNaN(Number(raw))
                    ? Number(raw).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : raw

                  return (
                    <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <dt className="text-sm font-medium text-slate-500">
                        {label}
                      </dt>
                      <dd className="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">
                        {display}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </Card>
          )}

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
                        {anexo.valido ? 'Valido' : 'Invalido'}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Motivo inabilitacao */}
          {inscricao.motivoInabilitacao && (
            <Card className="border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Motivo da Inabilitacao</h2>
              <p className="text-sm text-red-700">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>

        {/* Sidebar — avaliacoes e recursos */}
        <div className="space-y-6">
          {/* Avaliacoes */}
          {RESULTADO_VISIVEL.includes(inscricao.edital.status) && inscricao.avaliacoes.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Avaliacoes</h2>
              <div className="space-y-3">
                {inscricao.avaliacoes.map((avaliacao, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">Avaliacao {i + 1}</span>
                      <span className="text-lg font-bold text-brand-700">{String(avaliacao.notaTotal)}</span>
                    </div>
                    {avaliacao.parecer && (
                      <p className="text-xs text-slate-500 mt-1">{avaliacao.parecer}</p>
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
                {inscricao.recursos.map((recurso, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">{recurso.fase}</span>
                      {recurso.decisao && (
                        <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                          {recurso.decisao}
                        </Badge>
                      )}
                    </div>
                    {recurso.justificativa && (
                      <p className="text-xs text-slate-600 mt-1">{recurso.justificativa}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(recurso.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Interpor Recurso */}
          {['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE'].includes(inscricao.status) && (
            <Card>
              <RecursoForm
                inscricaoId={inscricao.id}
                fase={
                  inscricao.status === 'INABILITADA' ? 'HABILITACAO' :
                  inscricao.status === 'RESULTADO_PRELIMINAR' ? 'RESULTADO_PRELIMINAR' :
                  'RESULTADO_FINAL'
                }
              />
            </Card>
          )}

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

          {/* Acoes */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Acoes</h2>
            <div className="space-y-2">
              {inscricao.status === 'RASCUNHO' && (
                <Link
                  href={`/proponente/inscricoes/${inscricao.id}/editar`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Inscricao
                </Link>
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
