import type { EditalStatus } from '@prisma/client'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, EmptyState, IconShield, IconClock, IconCheck, IconClipboard } from '@/components/ui'
import { EditalPicker as EditalPickerBase, type EditalPickerCard } from '@/components/edital-picker'
import { whereInscricoesComRecurso, classificarRecurso } from './filtros'

export interface EditalRecursosCard {
  id: string
  titulo: string
  ano: number
  status: EditalStatus
  pendentes: number
  respondidos: number
  decididos: number
}

function paraCard(edital: EditalRecursosCard): EditalPickerCard {
  const total = edital.pendentes + edital.respondidos + edital.decididos

  return {
    id: edital.id,
    titulo: edital.titulo,
    ano: edital.ano,
    ativo: edital.status === 'RECURSO',
    href: `/avaliador/recursos?editalId=${edital.id}`,
    progresso: {
      label: 'Recursos encaminhados',
      pct: total > 0 ? Math.round(((edital.respondidos + edital.decididos) / total) * 100) : 0,
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
        valor: edital.decididos,
        label: 'Decididos',
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
          edital: { select: { id: true, titulo: true, ano: true, status: true } },
          recursos: {
            select: {
              decisao: true,
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
      { ...ins.edital, pendentes: 0, respondidos: 0, decididos: 0 }
    for (const recurso of ins.recursos) {
      const situacao = classificarRecurso(recurso)
      if (situacao === 'pendentes') card.pendentes++
      else if (situacao === 'respondidos') card.respondidos++
      else card.decididos++
    }
    porEdital.set(ins.editalId, card)
  }

  const cards = [...porEdital.values()].sort((a, b) => {
    const ativoA = a.status === 'RECURSO' ? 0 : 1
    const ativoB = b.status === 'RECURSO' ? 0 : 1
    if (ativoA !== ativoB) return ativoA - ativoB
    return b.ano - a.ano
  })

  if (cards.length === 1) {
    redirect(`/avaliador/recursos?editalId=${cards[0].id}`)
  }

  const pendentes = cards.reduce((acc, e) => acc + e.pendentes, 0)

  return (
    <EditalPickerBase
      titulo="Recursos"
      descricao="Escolha o edital para ver os recursos interpostos nas inscrições que você avalia."
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
            title="Nenhum recurso"
            description="Quando um proponente de uma inscrição sua interpuser recurso, ele aparece aqui para você responder."
          />
        </Card>
      }
    />
  )
}
