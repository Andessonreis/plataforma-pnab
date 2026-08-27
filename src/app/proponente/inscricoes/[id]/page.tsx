import type { Metadata } from 'next'
import { AvisoRetificacao } from '@/components/edital/faixa-retificacao'
import { retificacaoVigente } from '@/lib/utils/retificacao'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui'
import { DadosInscricaoView } from '@/components/inscricao/dados-inscricao-view'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { EtapaCustomizada } from '@/types/etapa-customizada'
import type { InscricaoStatus } from '@prisma/client'
import { SubmissionSuccessBanner } from './submission-success-banner'
import { InscricaoHeader } from './inscricao-header'
import { StatusTimeline } from './status-timeline'
import { InformacoesGeraisCard } from './informacoes-gerais-card'
import { AnexosCard } from './anexos-card'
import { MotivoInabilitacaoCard } from './motivo-inabilitacao-card'
import { AvaliacoesCard } from './avaliacoes-card'
import { RecursosCard } from './recursos-card'
import { InterporRecursoSection } from './interpor-recurso-section'
import { DocumentosCard } from './documentos-card'
import { AcoesCard } from './acoes-card'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enviada?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscrição ${id} — Portal PNAB Irecê` }
}

// Ordem esperada da timeline de status — status terminais (CONTEMPLADA, etc.)
// são mapeados à parte em `statusIndexMap` porque não aparecem aqui.
const STATUS_TIMELINE: InscricaoStatus[] = [
  'RASCUNHO',
  'ENVIADA',
  'HABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RESULTADO_FINAL',
]

// Status do edital em que notas/avaliações já podem ser exibidas ao proponente.
const RESULTADO_VISIVEL: string[] = ['RESULTADO_PRELIMINAR', 'RECURSO', 'RESULTADO_FINAL', 'ENCERRADO']

/** Posição da inscrição na timeline visual, cobrindo status terminais que não estão na régua. */
function timelineIndex(status: InscricaoStatus): number {
  const terminaisPosAvaliacao: InscricaoStatus[] = ['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE']
  if (terminaisPosAvaliacao.includes(status)) return STATUS_TIMELINE.length
  if (status === 'INABILITADA') return 1 // passou por RASCUNHO e ENVIADA, não por HABILITADA
  if (status === 'RECURSO_ABERTO') return STATUS_TIMELINE.indexOf('RESULTADO_PRELIMINAR')
  return STATUS_TIMELINE.indexOf(status)
}

/** Prisma `Json` pode voltar como string em vez de objeto — parseia com segurança. */
function parseCampos(raw: unknown): Record<string, unknown> {
  let value = raw
  if (typeof value === 'string') {
    try { value = JSON.parse(value) } catch { return {} }
  }
  return (value && typeof value === 'object' && !Array.isArray(value))
    ? value as Record<string, unknown>
    : {}
}

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
          cronograma: true, retificacoes: true,
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
          id: true, fase: true, texto: true, urlAnexos: true, decisao: true,
          justificativa: true, createdAt: true,
          respostas: { select: { decisao: true, justificativa: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!inscricao || inscricao.proponenteId !== session.user.id) {
    notFound()
  }

  const campos = parseCampos(inscricao.campos)
  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas : []) as unknown as EtapaCustomizada[]

  const status = inscricao.status as InscricaoStatus
  const resultadoVisivel = RESULTADO_VISIVEL.includes(inscricao.edital.status)
  const retificacaoAtual = retificacaoVigente(inscricao.edital.retificacoes)
  const mostrarSucesso = enviada === 'true' && status === 'ENVIADA'

  return (
    <section>
      {mostrarSucesso && (
        <SubmissionSuccessBanner
          inscricaoId={inscricao.id}
          numero={inscricao.numero}
          submittedAt={inscricao.submittedAt}
        />
      )}

      <InscricaoHeader
        numero={inscricao.numero}
        editalTitulo={inscricao.edital.titulo}
        editalAno={inscricao.edital.ano}
        status={status}
      />

      {/* Quem já enviou a inscrição não volta à página pública do edital: se o
          prazo mudou, é aqui que a pessoa precisa esbarrar no aviso. */}
      {retificacaoAtual && <AvisoRetificacao retificacao={retificacaoAtual} />}

      <StatusTimeline steps={STATUS_TIMELINE} currentIndex={timelineIndex(status)} currentStatus={status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Corpo principal — flui como um único documento (mesma linguagem
            visual das seções de DadosInscricaoView), não uma pilha de cards
            competindo pelo mesmo peso visual. */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <InformacoesGeraisCard
            numero={inscricao.numero}
            categoria={inscricao.categoria}
            submittedAt={inscricao.submittedAt}
            notaFinal={inscricao.notaFinal}
            formulaAvaliacao={Boolean(inscricao.edital.formulaAvaliacao)}
            resultadoVisivel={resultadoVisivel}
          />

          <div id="tour-detalhe-dados">
            <DadosInscricaoView
              proponente={inscricao.proponente}
              categoria={inscricao.categoria}
              campos={campos}
              camposFormulario={camposFormulario}
              etapasCustomizadas={etapasCustomizadas}
            />
          </div>

          <AnexosCard anexos={inscricao.anexos} />
          <MotivoInabilitacaoCard motivo={inscricao.motivoInabilitacao} />
        </div>

        {/* Coluna lateral fina — um único painel de status/metadados dividido
            por seção, não cinco cards empilhados do mesmo peso. */}
        <Card padding="lg" className="h-fit [&>*+*]:mt-5 [&>*+*]:pt-5 [&>*+*]:border-t [&>*+*]:border-slate-100">
          <AvaliacoesCard avaliacoes={inscricao.avaliacoes} resultadoVisivel={resultadoVisivel} />
          <RecursosCard recursos={inscricao.recursos} inscricaoId={inscricao.id} editalStatus={inscricao.edital.status} />
          <InterporRecursoSection
            status={status}
            cronograma={inscricao.edital.cronograma}
            inscricaoId={inscricao.id}
            numero={inscricao.numero}
            proponenteNome={inscricao.proponente.nome}
          />
          <DocumentosCard inscricaoId={inscricao.id} status={status} />
          <AcoesCard inscricaoId={inscricao.id} status={status} editalStatus={inscricao.edital.status} />
        </Card>
      </div>
    </section>
  )
}
