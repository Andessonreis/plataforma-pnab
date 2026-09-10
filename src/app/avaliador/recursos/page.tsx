import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { Card, Badge, EmptyState, FadeIn, IconShield, IconArrowLeft } from '@/components/ui'
import { SelecaoEdital } from './edital-picker'
import { classificarRecurso, whereInscricoesComRecurso } from './filtros'

export const metadata: Metadata = {
  title: 'Recursos — Portal PNAB Irecê',
}

const ROTULO_SITUACAO = {
  pendentes: 'pendente',
  respondidos: 'respondido',
  decididos: 'decidido',
} as const

const VARIANTE_SITUACAO = {
  pendentes: 'warning',
  respondidos: 'success',
  decididos: 'neutral',
} as const

interface Props {
  searchParams: Promise<{ editalId?: string }>
}

export default async function AvaliadorRecursosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const avaliadorId = session.user.id
  const editaisVisiveis = (await getEditaisVisiveis(avaliadorId, 'AVALIADOR')) ?? []

  const params = await searchParams
  const editalIdFiltro = params.editalId || undefined

  if (!editalIdFiltro) {
    return <SelecaoEdital avaliadorId={avaliadorId} editaisVisiveis={editaisVisiveis} />
  }

  // Edital fora da equipe do avaliador — mesmo destino do inexistente.
  if (!editaisVisiveis.includes(editalIdFiltro)) {
    redirect('/avaliador/recursos')
  }

  const edital = await prisma.edital.findUnique({
    where: { id: editalIdFiltro },
    select: { titulo: true, ano: true },
  })
  if (!edital) redirect('/avaliador/recursos')

  const inscricoes = await prisma.inscricao.findMany({
    where: whereInscricoesComRecurso(avaliadorId, [editalIdFiltro]),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      numero: true,
      proponente: { select: { nome: true } },
      recursos: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fase: true,
          decisao: true,
          respostas: { where: { avaliadorId }, select: { id: true } },
        },
      },
    },
  })

  const totalPendentes = inscricoes.reduce(
    (acc, ins) => acc + ins.recursos.filter((r) => classificarRecurso(r) === 'pendentes').length,
    0,
  )

  return (
    <section>
      <FadeIn>
        <header className="mb-4 sm:mb-6">
          {editaisVisiveis.length > 1 && (
            <Link
              href="/avaliador/recursos"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
            >
              <IconArrowLeft className="h-4 w-4" />
              Trocar edital
            </Link>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{edital.titulo}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Edição {edital.ano} <span className="text-slate-400">·</span>{' '}
            {totalPendentes > 0
              ? `${totalPendentes} recurso(s) aguardando sua resposta`
              : 'Recursos das suas inscrições'}
          </p>
        </header>
      </FadeIn>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso neste edital"
            description="Quando um proponente de uma inscrição sua interpuser recurso, ele aparece aqui para você responder."
          />
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {inscricoes.map((ins) => (
            <Link
              key={ins.id}
              href={`/avaliador/inscricoes/${ins.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{ins.proponente.nome}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{ins.numero}</p>
                </div>
                <span className="text-brand-600 text-sm font-medium shrink-0">Responder →</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ins.recursos.map((r) => {
                  const situacao = classificarRecurso(r)
                  return (
                    <Badge key={r.id} variant={VARIANTE_SITUACAO[situacao]}>
                      {r.fase} · {ROTULO_SITUACAO[situacao]}
                    </Badge>
                  )
                })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
