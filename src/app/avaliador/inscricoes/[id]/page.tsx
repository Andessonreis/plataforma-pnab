import type { Metadata } from 'next'
import { auth } from '@server/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge } from '@client/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { CRITERIOS_AVALIACAO_PADRAO, type CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { InscricaoStatus } from '@prisma/client'
import { AvaliacaoForm } from '@/app/admin/inscricoes/[id]/avaliacao-form'
import { AnexoViewer } from '@/app/admin/inscricoes/[id]/anexo-viewer'
import { RecursoRespostaAvaliador } from '@/app/admin/inscricoes/[id]/recurso-resposta-avaliador'
import { RecursoAnexos } from '@client/components/recurso/recurso-anexos'
import { temAcessoEdital } from '@server/lib/edital-acesso'
import { DadosInscricaoView } from '@client/components/inscricao/dados-inscricao-view'
import { podeAvaliar, mensagemForaDaFase } from '@shared/edital/fase'
import { ForaDaFaseAlert } from '@client/components/edital/fora-da-fase-alert'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import type { EtapaCustomizada } from '@shared/types/etapa-customizada'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Avaliação ${id} — Portal PNAB Irecê` }
}

export default async function AvaliadorInscricaoDetailPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const { id } = await params

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: {
        select: {
          titulo: true, slug: true, ano: true, status: true,
          criteriosAvaliacao: true, formulaAvaliacao: true,
          camposFormulario: true, etapasCustomizadas: true,
        },
      },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      avaliacoes: {
        include: { avaliador: { select: { nome: true } } },
        orderBy: { createdAt: 'asc' },
      },
      recursos: {
        include: {
          respostas: { where: { avaliadorId: session.user.id } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!inscricao) notFound()

  // Verificar se o avaliador tem acesso ao edital (via equipe ou compat quando sem equipe)
  const hasAcesso = await temAcessoEdital(session.user.id, inscricao.editalId, 'AVALIADOR')
  if (!hasAcesso) {
    redirect('/avaliador/inscricoes?aviso=nao-atribuido')
  }

  // Avaliação existente do usuário (pode não existir ainda — será criada no primeiro submit)
  const minhaAvaliacao = inscricao.avaliacoes.find((a) => a.avaliadorId === session.user.id)

  const campos = (inscricao.campos && typeof inscricao.campos === 'object') ? inscricao.campos as Record<string, unknown> : {}

  const criteriosEdital = Array.isArray(inscricao.edital.criteriosAvaliacao)
    ? (inscricao.edital.criteriosAvaliacao as unknown as CriterioAvaliacao[])
    : []
  const criterios = criteriosEdital.length > 0 ? criteriosEdital : [...CRITERIOS_AVALIACAO_PADRAO]

  const camposFormulario = (Array.isArray(inscricao.edital.camposFormulario)
    ? inscricao.edital.camposFormulario : []) as unknown as CampoFormulario[]
  const etapasCustomizadas = (Array.isArray(inscricao.edital.etapasCustomizadas)
    ? inscricao.edital.etapasCustomizadas : []) as unknown as EtapaCustomizada[]

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/avaliador/inscricoes"
          className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-3"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{inscricao.numero}</h1>
            <p className="text-sm text-slate-500 mt-1">{inscricao.edital.titulo}</p>
          </div>
          <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
            {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
          </Badge>
        </div>
      </div>

      <DadosInscricaoView
        proponente={inscricao.proponente}
        categoria={inscricao.categoria}
        campos={campos}
        camposFormulario={camposFormulario}
        etapasCustomizadas={etapasCustomizadas}
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

      {/* Recursos — responder (apenas avaliador designado desta inscrição) */}
      {minhaAvaliacao && inscricao.recursos.length > 0 && (
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Recursos</h2>
          <div className="space-y-4">
            {inscricao.recursos.map((recurso) => {
              const minha = recurso.respostas[0]
              return (
                <div key={recurso.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="info">{recurso.fase}</Badge>
                    {recurso.decisao && (
                      <Badge variant={recurso.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                        {recurso.decisao}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{recurso.texto}</p>
                  {recurso.urlAnexos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Anexos do recurso</p>
                      <RecursoAnexos
                        urls={recurso.urlAnexos}
                        inscricaoId={inscricao.id}
                        recursoId={recurso.id}
                        scope="admin"
                      />
                    </div>
                  )}

                  {recurso.decisao ? (
                    <p className="text-xs text-slate-500 mt-3">
                      Recurso já decidido. Sua resposta foi registrada.
                    </p>
                  ) : (
                    <div className="mt-3">
                      {minha && (
                        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-slate-500">Sua resposta</p>
                            <Badge variant={minha.decisao === 'DEFERIDO' ? 'success' : 'error'}>
                              {minha.decisao}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{minha.justificativa}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            Você pode revisar enquanto o recurso não for decidido.
                          </p>
                        </div>
                      )}
                      <RecursoRespostaAvaliador
                        inscricaoId={inscricao.id}
                        recursoId={recurso.id}
                        fase={recurso.fase}
                        initialDecisao={(minha?.decisao as 'DEFERIDO' | 'INDEFERIDO' | undefined) ?? null}
                        initialJustificativa={minha?.justificativa ?? ''}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Formulário de avaliação — gateado por fase do edital (#84) */}
      {podeAvaliar(inscricao.edital.status) ? (
        <AvaliacaoForm
          inscricaoId={inscricao.id}
          inscricaoNumero={inscricao.numero}
          criterios={criterios}
          initialAvaliacao={
            minhaAvaliacao
              ? {
                id: minhaAvaliacao.id,
                notas: minhaAvaliacao.notas as { criterio: string; nota: number; peso: number }[],
                parecer: minhaAvaliacao.parecer,
                notaTotal: minhaAvaliacao.notaTotal === null ? null : String(minhaAvaliacao.notaTotal),
                finalizada: minhaAvaliacao.finalizada,
                updatedAt: minhaAvaliacao.updatedAt.toISOString(),
              }
              : null
          }
          formulaAvaliacao={inscricao.edital.formulaAvaliacao}
        />
      ) : (
        <ForaDaFaseAlert
          mensagem={mensagemForaDaFase(inscricao.edital.status, 'avaliar')}
          isAdmin={false}
        />
      )}
    </section>
  )
}
