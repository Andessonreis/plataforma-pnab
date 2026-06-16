import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@server/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge } from '@client/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import { DadosInscricaoView } from '@client/components/inscricao/dados-inscricao-view'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import { RetractAndEditButton } from './retract-and-edit-button'
import { SucessoBanner } from './_components/SucessoBanner'
import { StatusTimeline } from './_components/StatusTimeline'
import { InformacoesGeraisCard } from './_components/InformacoesGeraisCard'
import { AnexosCard } from './_components/AnexosCard'
import { AvaliacoesCard } from './_components/AvaliacoesCard'
import { RecursosCard } from './_components/RecursosCard'
import { InterporRecursoCard } from './_components/InterporRecursoCard'
import { DocumentosCard } from './_components/DocumentosCard'

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
        select: { id: true, fase: true, texto: true, urlAnexos: true, decisao: true, justificativa: true, createdAt: true },
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
        <SucessoBanner
          inscricaoId={inscricao.id}
          numero={inscricao.numero}
          submittedAt={inscricao.submittedAt}
        />
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
      <StatusTimeline
        statusTimeline={statusTimeline}
        currentStatusIndex={currentStatusIndex}
        status={inscricao.status as InscricaoStatus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados da inscricao */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações gerais */}
          <InformacoesGeraisCard
            numero={inscricao.numero}
            categoria={inscricao.categoria}
            submittedAt={inscricao.submittedAt}
            notaFinal={inscricao.notaFinal}
            editalStatus={inscricao.edital.status}
            formulaAvaliacao={inscricao.edital.formulaAvaliacao}
            resultadoVisivel={RESULTADO_VISIVEL.includes(inscricao.edital.status)}
          />

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
            <AnexosCard anexos={inscricao.anexos} />
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
            <AvaliacoesCard avaliacoes={inscricao.avaliacoes} />
          )}

          {/* Recursos */}
          {inscricao.recursos.length > 0 && (
            <RecursosCard
              recursos={inscricao.recursos}
              inscricaoId={inscricao.id}
              editalStatus={inscricao.edital.status}
            />
          )}

          {/* Interpor Recurso — gateado por status + janela do cronograma */}
          {['INABILITADA', 'RESULTADO_PRELIMINAR', 'NAO_CONTEMPLADA', 'SUPLENTE'].includes(inscricao.status) && (
            <InterporRecursoCard
              status={inscricao.status}
              cronograma={inscricao.edital.cronograma}
              inscricaoId={inscricao.id}
              numero={inscricao.numero}
              proponenteNome={inscricao.proponente.nome}
            />
          )}

          {/* Documentos */}
          {inscricao.status !== 'RASCUNHO' && (
            <DocumentosCard inscricaoId={inscricao.id} />
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
