import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { CRITERIOS_AVALIACAO_PADRAO, type CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import type { InscricaoStatus } from '@prisma/client'
import { AvaliacaoForm } from '@/app/admin/inscricoes/[id]/avaliacao-form'
import { AnexoViewer } from '@/app/admin/inscricoes/[id]/anexo-viewer'
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
      edital: { select: { titulo: true, slug: true, ano: true, criteriosAvaliacao: true } },
      proponente: {
        select: { nome: true, cpfCnpj: true, email: true, telefone: true, tipoProponente: true },
      },
      anexos: true,
      avaliacoes: {
        include: { avaliador: { select: { nome: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!inscricao) notFound()

  // Verificar se o avaliador tem acesso a esta inscrição
  const minhaAvaliacao = inscricao.avaliacoes.find((a) => a.avaliadorId === session.user.id)
  if (!minhaAvaliacao) {
    redirect('/avaliador/inscricoes?aviso=nao-atribuido')
  }

  const campos = (inscricao.campos && typeof inscricao.campos === 'object') ? inscricao.campos as Record<string, unknown> : {}

  const criteriosEdital = Array.isArray(inscricao.edital.criteriosAvaliacao)
    ? (inscricao.edital.criteriosAvaliacao as unknown as CriterioAvaliacao[])
    : []
  const criterios = criteriosEdital.length > 0 ? criteriosEdital : [...CRITERIOS_AVALIACAO_PADRAO]

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

      {/* Dados do proponente */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Proponente</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Nome</dt>
            <dd className="font-medium text-slate-900">{inscricao.proponente.nome}</dd>
          </div>
          <div>
            <dt className="text-slate-500">CPF/CNPJ</dt>
            <dd className="font-mono text-slate-900">{inscricao.proponente.cpfCnpj}</dd>
          </div>
          {inscricao.proponente.email && (
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd className="text-slate-900">{inscricao.proponente.email}</dd>
            </div>
          )}
          {inscricao.categoria && (
            <div>
              <dt className="text-slate-500">Categoria</dt>
              <dd className="text-slate-900">{inscricao.categoria}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Campos preenchidos */}
      {Object.keys(campos).length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Dados do Projeto</h2>
          <dl className="space-y-3 text-sm">
            {Object.entries(campos).map(([key, value]) => (
              <div key={key} className="border-b border-slate-100 pb-3 last:border-0">
                <dt className="text-slate-500 mb-0.5">{key}</dt>
                <dd className="text-slate-900 whitespace-pre-wrap">{String(value ?? '—')}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Anexos */}
      {inscricao.anexos.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 mb-3">
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

      {/* Formulário de avaliação */}
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
              notaTotal: String(minhaAvaliacao.notaTotal),
              finalizada: minhaAvaliacao.finalizada,
              updatedAt: minhaAvaliacao.updatedAt.toISOString(),
            }
            : null
        }
      />
    </section>
  )
}
