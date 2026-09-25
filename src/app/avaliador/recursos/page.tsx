import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { Card, Badge, EmptyState, IconShield } from '@/components/ui'
import { CabecalhoEdital } from '../cabecalho-edital'
import { exigirSessaoAvaliador } from '../sessao-avaliador'
import { SelecaoEdital } from './edital-picker'
import { WHERE_RECURSO_ATIVO, classificarRecurso, whereInscricoesComRecurso } from './filtros'

export const metadata: Metadata = {
  title: 'Recursos — Portal PNAB Irecê',
}

const ROTULO_SITUACAO = {
  pendentes: 'pendente',
  respondidos: 'respondido',
} as const

const VARIANTE_SITUACAO = {
  pendentes: 'warning',
  respondidos: 'success',
} as const

interface Props {
  searchParams: Promise<{ editalId?: string }>
}

export default async function AvaliadorRecursosPage({ searchParams }: Props) {
  const { avaliadorId } = await exigirSessaoAvaliador()
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
        where: WHERE_RECURSO_ATIVO,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fase: true,
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
      <CabecalhoEdital
        icone={<IconShield className="h-6 w-6" />}
        editalId={editalIdFiltro}
        titulo={edital.titulo}
        ano={edital.ano}
        ativo={inscricoes.length > 0}
        situacao={
          totalPendentes > 0
            ? `${totalPendentes} ${totalPendentes === 1 ? 'recurso aguarda' : 'recursos aguardam'} sua resposta.`
            : 'Nenhum recurso aguardando você neste edital.'
        }
        voltarHref={editaisVisiveis.length > 1 ? '/avaliador/recursos' : undefined}
      />

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso em aberto neste edital"
            description="Quando um proponente de uma inscrição sua interpuser recurso, ele aparece aqui para você responder. Recursos já decididos saem desta lista."
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
