import type { EditalStatus } from '@prisma/client'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EDITAL_STATUS_COM_AVALIACAO } from '@/lib/services/avaliacao-buckets'
import { Card, EmptyState, IconStar, IconClipboard, IconClock, IconCheck } from '@/components/ui'
import { EditalPicker as EditalPickerBase, type EditalPickerCard } from '@/components/edital-picker'
import { classificarMinhaAvaliacao, whereInscricoesDoAvaliador } from './filtros'

export interface EditalAvaliadorCard {
  id: string
  titulo: string
  ano: number
  status: EditalStatus
  aAvaliar: number
  emAvaliacao: number
  avaliadas: number
}

function paraCard(edital: EditalAvaliadorCard): EditalPickerCard {
  const total = edital.aAvaliar + edital.emAvaliacao + edital.avaliadas

  return {
    id: edital.id,
    titulo: edital.titulo,
    ano: edital.ano,
    ativo: edital.status === 'AVALIACAO',
    href: `/avaliador/inscricoes?editalId=${edital.id}`,
    progresso: {
      label: 'Suas avaliações concluídas',
      pct: total > 0 ? Math.round((edital.avaliadas / total) * 100) : 0,
    },
    stats: [
      {
        icone: <IconClipboard className="h-4 w-4 text-amber-500" />,
        valor: edital.aAvaliar,
        label: 'A avaliar',
        cor: 'text-amber-600',
      },
      {
        icone: <IconClock className="h-4 w-4 text-blue-500" />,
        valor: edital.emAvaliacao,
        label: 'Em avaliação',
        cor: 'text-blue-600',
      },
      {
        icone: <IconCheck className="h-4 w-4 text-emerald-500" />,
        valor: edital.avaliadas,
        label: 'Avaliadas',
        cor: 'text-emerald-600',
      },
    ],
  }
}

/**
 * Seleção de edital do avaliador. Vai direto para a fila quando ele só tem um
 * edital — nesse caso a tela intermediária seria um clique sem escolha.
 */
export async function SelecaoEdital({
  avaliadorId,
  editaisVisiveis,
}: {
  avaliadorId: string
  editaisVisiveis: string[]
}) {
  const editais = editaisVisiveis.length
    ? await prisma.edital.findMany({
        where: { id: { in: editaisVisiveis }, status: { in: EDITAL_STATUS_COM_AVALIACAO } },
        select: { id: true, titulo: true, ano: true, status: true },
      })
    : []

  const inscricoes = editais.length
    ? await prisma.inscricao.findMany({
        where: whereInscricoesDoAvaliador(editais.map((e) => e.id)),
        select: {
          editalId: true,
          avaliacoes: { where: { avaliadorId }, select: { finalizada: true } },
        },
      })
    : []

  const tally = new Map<string, { aAvaliar: number; emAvaliacao: number; avaliadas: number }>()
  for (const e of editais) tally.set(e.id, { aAvaliar: 0, emAvaliacao: 0, avaliadas: 0 })
  for (const ins of inscricoes) {
    const t = tally.get(ins.editalId)
    if (!t) continue
    const aba = classificarMinhaAvaliacao(ins.avaliacoes)
    if (aba === 'a_avaliar') t.aAvaliar++
    else if (aba === 'em_avaliacao') t.emAvaliacao++
    else t.avaliadas++
  }

  // Editais em avaliação sempre aparecem; encerrados só quando têm histórico.
  const cards: EditalAvaliadorCard[] = editais
    .map((e) => ({ ...e, ...tally.get(e.id)! }))
    .filter((c) => c.status === 'AVALIACAO' || c.aAvaliar + c.emAvaliacao + c.avaliadas > 0)
    .sort((a, b) => {
      const ativoA = a.status === 'AVALIACAO' ? 0 : 1
      const ativoB = b.status === 'AVALIACAO' ? 0 : 1
      if (ativoA !== ativoB) return ativoA - ativoB
      return b.ano - a.ano
    })

  if (cards.length === 1) {
    redirect(`/avaliador/inscricoes?editalId=${cards[0].id}`)
  }

  const pendentes = cards
    .filter((e) => e.status === 'AVALIACAO')
    .reduce((acc, e) => acc + e.aAvaliar + e.emAvaliacao, 0)

  return (
    <EditalPickerBase
      titulo="Minhas Avaliações"
      descricao="Escolha o edital para abrir a fila de inscrições que você avalia. Cada edital tem seus próprios critérios de pontuação — avaliar um de cada vez evita misturar régua de edital diferente."
      icone={<IconStar className="h-6 w-6" />}
      editais={cards.map(paraCard)}
      resumoAtivos={
        pendentes > 0
          ? `${pendentes} ${pendentes === 1 ? 'inscrição aguardando você' : 'inscrições aguardando você'}`
          : 'tudo avaliado'
      }
      vazio={
        <Card>
          <EmptyState
            icon={<IconStar className="h-8 w-8 text-slate-400" />}
            title="Nenhum edital para avaliar"
            description="Você verá aqui os editais em que foi designado como avaliador, assim que entrarem na fase de avaliação."
          />
        </Card>
      }
    />
  )
}
