import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import { HabilitacaoActions } from './habilitacao-actions'

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

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      edital: { select: { titulo: true, slug: true, ano: true } },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      avaliacoes: {
        include: { avaliador: { select: { nome: true } } },
      },
      recursos: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!inscricao) notFound()

  const campos = inscricao.campos as Record<string, unknown>
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/admin/inscricoes"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Inscricoes
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Inscricao {inscricao.numero}</h1>
          <p className="text-slate-600 mt-1">
            {inscricao.edital.titulo} ({inscricao.edital.ano})
          </p>
        </div>
        <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]} className="text-sm px-3 py-1">
          {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do proponente */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Proponente</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Dados da Proposta</h2>
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
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Anexos ({inscricao.anexos.length})
              </h2>
              <div className="space-y-2">
                {inscricao.anexos.map((anexo) => (
                  <div key={anexo.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
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
                    {anexo.observacao && (
                      <span className="text-xs text-slate-500">{anexo.observacao}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Avaliacoes */}
          {inscricao.avaliacoes.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Avaliacoes</h2>
              <div className="space-y-4">
                {inscricao.avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {avaliacao.avaliador.nome}
                      </span>
                      <span className="text-xl font-bold text-brand-700">
                        {String(avaliacao.notaTotal)}
                      </span>
                    </div>
                    {avaliacao.parecer && (
                      <p className="text-sm text-slate-600 mt-2">{avaliacao.parecer}</p>
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
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recursos</h2>
              <div className="space-y-4">
                {inscricao.recursos.map((recurso) => (
                  <div key={recurso.id} className="p-4 border border-slate-200 rounded-lg">
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
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna lateral — Acoes */}
        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase">Numero</dt>
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
                    : 'Nao enviada'}
                </dd>
              </div>
              {inscricao.notaFinal && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">Nota Final</dt>
                  <dd className="text-2xl font-bold text-brand-700">{String(inscricao.notaFinal)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Habilitacao */}
          {canHabilitar && isHabilitacaoStatus && (
            <HabilitacaoActions
              inscricaoId={inscricao.id}
              currentStatus={inscricao.status as InscricaoStatus}
              motivoAtual={inscricao.motivoInabilitacao ?? ''}
            />
          )}

          {/* Motivo inabilitacao */}
          {inscricao.motivoInabilitacao && (
            <Card className="border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Motivo da Inabilitacao</h2>
              <p className="text-sm text-red-700">{inscricao.motivoInabilitacao}</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
