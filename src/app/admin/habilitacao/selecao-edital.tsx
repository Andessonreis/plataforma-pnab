import { prisma } from '@/lib/db'
import { Card, EmptyState, FadeIn, IconShield } from '@/components/ui'
import { EditalPicker, type EditalHabilitacaoCard } from './edital-picker'
import { EDITAL_STATUS_COM_HABILITACAO, STATUS_HABILITACAO } from './constantes'

/** Tela de seleção de edital — sempre aparece, mesmo com um edital só. */
export async function SelecaoEdital({ editaisVisiveis }: { editaisVisiveis: string[] | null }) {
  const editais = await prisma.edital.findMany({
    where: {
      status: { in: EDITAL_STATUS_COM_HABILITACAO },
      ...(editaisVisiveis ? { id: { in: editaisVisiveis } } : {}),
    },
    select: { id: true, titulo: true, ano: true, status: true },
  })

  const contagens = editais.length
    ? await prisma.inscricao.groupBy({
        by: ['editalId', 'status'],
        where: {
          editalId: { in: editais.map((e) => e.id) },
          status: { in: STATUS_HABILITACAO },
        },
        _count: { _all: true },
      })
    : []

  const tally = new Map<string, { pendentes: number; habilitadas: number; inabilitadas: number }>()
  for (const e of editais) tally.set(e.id, { pendentes: 0, habilitadas: 0, inabilitadas: 0 })
  for (const c of contagens) {
    const t = tally.get(c.editalId)
    if (!t) continue
    const n = c._count._all
    if (c.status === 'ENVIADA') t.pendentes += n
    else if (c.status === 'HABILITADA') t.habilitadas += n
    else if (c.status === 'INABILITADA') t.inabilitadas += n
  }

  // Editais na fase ativa sempre aparecem; encerrados só quando têm histórico.
  const cards: EditalHabilitacaoCard[] = editais
    .map((e) => ({ ...e, ...tally.get(e.id)! }))
    .filter((c) => c.status === 'HABILITACAO' || c.pendentes + c.habilitadas + c.inabilitadas > 0)
    .sort((a, b) => {
      const ativoA = a.status === 'HABILITACAO' ? 0 : 1
      const ativoB = b.status === 'HABILITACAO' ? 0 : 1
      if (ativoA !== ativoB) return ativoA - ativoB
      return b.ano - a.ano
    })

  if (cards.length === 0) {
    return (
      <section>
        <FadeIn>
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-brand-50 text-brand-700 shrink-0 ring-1 ring-brand-100">
                <IconShield className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Conferência e Habilitação Documental
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                  Confira a documentação enviada pelos proponentes e valide as inscrições para análise e avaliação.
                </p>
              </div>
            </div>
          </header>
        </FadeIn>
        <Card padding="md">
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital em habilitação"
            description="Quando um edital entrar na fase de habilitação, ele aparecerá aqui para conferência."
          />
        </Card>
      </section>
    )
  }

  return <EditalPicker editais={cards} />
}
