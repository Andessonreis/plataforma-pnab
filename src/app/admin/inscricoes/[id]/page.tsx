import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { CRITERIOS_AVALIACAO_PADRAO, type CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { InscricaoStatus } from '@prisma/client'
import { HabilitacaoActions } from './habilitacao-actions'
import { AvaliacaoForm } from './avaliacao-form'
import { RecursoDecision } from './recurso-decision'
import { AnexoViewer } from './anexo-viewer'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Inscricao ${id} — Admin PNAB` }
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
      edital: { select: { titulo: true, slug: true, ano: true, criteriosAvaliacao: true } },
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

  // AVALIADOR só acessa inscrições atribuídas a ele
  if (isAvaliador) {
    const assignedById = await prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      select: { id: true },
    })
    if (!assignedById) {
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

  const rawCampos = inscricao.campos
  const campos: Record<string, unknown> =
    typeof rawCampos === 'string'
      ? (() => { try { return JSON.parse(rawCampos) } catch { return {} } })()
      : (rawCampos && typeof rawCampos === 'object' && !Array.isArray(rawCampos))
        ? (rawCampos as Record<string, unknown>)
        : {}
  const canHabilitar = session.user.role === 'ADMIN' || session.user.role === 'HABILITADOR'
  const isHabilitacaoStatus = inscricao.status === 'ENVIADA' || inscricao.status === 'HABILITADA' || inscricao.status === 'INABILITADA'

  const tipoLabels: Record<string, string> = {
    PF: 'Pessoa Fisica',
    PJ: 'Pessoa Juridica',
    MEI: 'MEI',
    COLETIVO: 'Coletivo',
  }

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
          {/* Dados do proponente */}
          <Card padding="sm" className="sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Proponente</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Nome</dt>
                <dd className="text-sm text-slate-900 font-medium">{inscricao.proponente.nome}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">CPF/CNPJ</dt>
                <dd className="text-sm text-slate-900 font-mono">{inscricao.proponente.cpfCnpj}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">E-mail</dt>
                <dd className="text-sm text-slate-900">{inscricao.proponente.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Telefone</dt>
                <dd className="text-sm text-slate-900">{inscricao.proponente.telefone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Tipo</dt>
                <dd className="text-sm text-slate-900">
                  {tipoLabels[inscricao.proponente.tipoProponente ?? ''] ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Categoria</dt>
                <dd className="text-sm text-slate-900">{inscricao.categoria ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          {/* Dados da proposta */}
          {Object.keys(campos).length > 0 && (
            <Card padding="sm" className="sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Dados da Proposta</h2>
              <dl className="space-y-3">
                {Object.entries(campos).map(([key, value]) => (
                  <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <dt className="text-sm font-medium text-slate-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Anexos */}
          {inscricao.anexos.length > 0 && (
            <Card padding="sm" className="sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                Anexos ({inscricao.anexos.length})
              </h2>
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
            </Card>
          )}

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
                          {parseFloat(String(avaliacao.notaTotal)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {avaliacao.parecer && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{avaliacao.parecer}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR')}
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
                    <p className="text-sm text-slate-700 mt-2">{recurso.texto}</p>
                    {recurso.justificativa && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">Justificativa:</p>
                        <p className="text-sm text-slate-700">{recurso.justificativa}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(recurso.createdAt).toLocaleDateString('pt-BR')}
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
                    })
                    : 'Não enviada'}
                </dd>
              </div>
              {inscricao.notaFinal && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Nota Final</dt>
                  <dd className="text-2xl font-bold text-brand-700 tabular-nums">
                    {parseFloat(String(inscricao.notaFinal)).toFixed(1)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Formulário de avaliação — AVALIADOR e ADMIN */}
          {(isAvaliador || isAdmin) && (
            <AvaliacaoForm
              inscricaoId={inscricao.id}
              inscricaoNumero={inscricao.numero}
              criterios={criterios}
              initialAvaliacao={
                meuAvaliacao
                  ? {
                    id: meuAvaliacao.id,
                    notas: meuAvaliacao.notas as { criterio: string; nota: number; peso: number }[],
                    parecer: meuAvaliacao.parecer,
                    notaTotal: String(meuAvaliacao.notaTotal),
                    finalizada: meuAvaliacao.finalizada,
                    updatedAt: meuAvaliacao.updatedAt.toISOString(),
                  }
                  : null
              }
              isAdmin={isAdmin}
            />
          )}

          {/* Habilitação */}
          {canHabilitar && isHabilitacaoStatus && (
            <HabilitacaoActions
              inscricaoId={inscricao.id}
              currentStatus={inscricao.status as InscricaoStatus}
              motivoAtual={inscricao.motivoInabilitacao ?? ''}
            />
          )}

          {/* Motivo inabilitação */}
          {inscricao.motivoInabilitacao && (
            <Card padding="sm" className="sm:p-6 border-red-200 bg-red-50">
              <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Motivo da Inabilitação</h2>
              <p className="text-sm text-red-700">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
