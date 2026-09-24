import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, EmptyState, IconShield, IconClock, IconCheck, IconClipboard } from '@/components/ui'
import { EditalPicker as EditalPickerBase, type EditalPickerCard } from '@/components/edital-picker'
import { WHERE_RECURSO_ATIVO, whereInscricoesComRecurso, classificarRecurso } from './filtros'

export interface EditalRecursosCard {
  id: string
  titulo: string
  ano: number
  pendentes: number
  respondidos: number
}

function paraCard(edital: EditalRecursosCard): EditalPickerCard {
  const total = edital.pendentes + edital.respondidos

  return {
    id: edital.id,
    titulo: edital.titulo,
    ano: edital.ano,
    // Só chega aqui edital com recurso sem decisão, ou seja, com trabalho em aberto.
    ativo: true,
    href: `/avaliador/recursos?editalId=${edital.id}`,
    progresso: {
      label: 'Recursos encaminhados',
      pct: total > 0 ? Math.round((edital.respondidos / total) * 100) : 0,
    },
    stats: [
      {
        icone: <IconClipboard className="h-4 w-4 text-amber-500" />,
        valor: edital.pendentes,
        label: 'A responder',
        cor: 'text-amber-600',
      },
      {
        icone: <IconClock className="h-4 w-4 text-blue-500" />,
        valor: edital.respondidos,
        label: 'Respondidos',
        cor: 'text-blue-600',
      },
      {
        icone: <IconCheck className="h-4 w-4 text-emerald-500" />,
        valor: total,
        label: 'Total',
        cor: 'text-emerald-600',
      },
    ],
  }
}

/** Seleção de edital dos recursos. Pula a tela quando só há um edital com recurso. */
export async function SelecaoEdital({
  avaliadorId,
  editaisVisiveis,
}: {
  avaliadorId: string
  editaisVisiveis: string[]
}) {
  const inscricoes = editaisVisiveis.length
    ? await prisma.inscricao.findMany({
        where: whereInscricoesComRecurso(avaliadorId, editaisVisiveis),
        select: {
          editalId: true,
          edital: { select: { id: true, titulo: true, ano: true } },
          recursos: {
            where: WHERE_RECURSO_ATIVO,
            select: {
              respostas: { where: { avaliadorId }, select: { id: true } },
            },
          },
        },
      })
    : []

  const porEdital = new Map<string, EditalRecursosCard>()
  for (const ins of inscricoes) {
    const card =
      porEdital.get(ins.editalId) ??
      { ...ins.edital, pendentes: 0, respondidos: 0 }
    for (const recurso of ins.recursos) {
      if (classificarRecurso(recurso) === 'pendentes') card.pendentes++
      else card.respondidos++
    }
    porEdital.set(ins.editalId, card)
  }

  const cards = [...porEdital.values()].sort((a, b) => b.ano - a.ano)

  if (cards.length === 1) {
    redirect(`/avaliador/recursos?editalId=${cards[0].id}`)
  }

  const pendentes = cards.reduce((acc, e) => acc + e.pendentes, 0)

  return (
    <EditalPickerBase
      titulo="Recursos"
      descricao="Escolha o edital para ver os recursos em aberto nas inscrições que você avalia."
      icone={<IconShield className="h-6 w-6" />}
      editais={cards.map(paraCard)}
      resumoAtivos={
        pendentes > 0
          ? `${pendentes} ${pendentes === 1 ? 'recurso aguardando você' : 'recursos aguardando você'}`
          : 'tudo respondido'
      }
      vazio={
        <Card>
          <EmptyState
            icon={<IconShield className="h-8 w-8 text-slate-400" />}
            title="Nenhum recurso em aberto"
            description="Quando um proponente de uma inscrição sua interpuser recurso, ele aparece aqui para você responder. Recursos já decididos saem desta lista."
          />
        </Card>
      }
    />
  )
}
