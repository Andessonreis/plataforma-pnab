import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@server/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@server/lib/db'
import { Card, Badge, EmptyState, FadeIn, IconShield } from '@client/components/ui'
import { getEditaisVisiveis } from '@/lib/edital-acesso'

export const metadata: Metadata = {
  title: 'Recursos — Portal PNAB Irecê',
}

export default async function AvaliadorRecursosPage() {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const editaisVisiveis = await getEditaisVisiveis(session.user.id, 'AVALIADOR')

  // Apenas inscrições onde este avaliador é designado (tem Avaliacao) e que têm recurso.
  const where: Record<string, unknown> = {
    avaliacoes: { some: { avaliadorId: session.user.id } },
    recursos: { some: {} },
  }
  if (editaisVisiveis !== null) {
    where.editalId = { in: editaisVisiveis }
  }

  const inscricoes = await prisma.inscricao.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      edital: { select: { titulo: true } },
      proponente: { select: { nome: true, cpfCnpj: true } },
      recursos: {
        orderBy: { createdAt: 'desc' },
        include: {
          respostas: { where: { avaliadorId: session.user.id }, select: { id: true } },
        },
      },
    },
  })

  const totalPendentes = inscricoes.reduce(
    (acc, ins) => acc + ins.recursos.filter((r) => !r.decisao && r.respostas.length === 0).length,
    0,
  )

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {totalPendentes > 0
              ? `${totalPendentes} recurso(s) aguardando sua resposta`
              : 'Recursos das suas inscrições'}
          </p>
        </div>
      </FadeIn>

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso"
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
                  <p className="text-xs text-slate-500 line-clamp-1">{ins.edital.titulo}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{ins.numero}</p>
                </div>
                <span className="text-brand-600 text-sm font-medium shrink-0">Responder →</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ins.recursos.map((r) => {
                  const respondido = r.respostas.length > 0
                  const variant = r.decisao ? 'neutral' : respondido ? 'success' : 'warning'
                  const texto = r.decisao
                    ? `${r.fase} · decidido`
                    : respondido
                      ? `${r.fase} · respondido`
                      : `${r.fase} · pendente`
                  return (
                    <Badge key={r.id} variant={variant}>
                      {texto}
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
