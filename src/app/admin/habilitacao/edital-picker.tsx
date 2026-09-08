import type { EditalStatus } from '@prisma/client'
import { IconShield, IconClipboard, IconCheck, IconClose } from '@/components/ui'
import { EditalPicker as EditalPickerBase, type EditalPickerCard } from '@/components/admin/edital-picker'

export interface EditalHabilitacaoCard {
  id: string
  titulo: string
  ano: number
  status: EditalStatus
  pendentes: number
  habilitadas: number
  inabilitadas: number
}

function paraCard(edital: EditalHabilitacaoCard): EditalPickerCard {
  const total = edital.pendentes + edital.habilitadas + edital.inabilitadas
  const decididas = edital.habilitadas + edital.inabilitadas

  return {
    id: edital.id,
    titulo: edital.titulo,
    ano: edital.ano,
    ativo: edital.status === 'HABILITACAO',
    href: `/admin/habilitacao?editalId=${edital.id}`,
    progresso: {
      label: 'Documentação conferida',
      pct: total > 0 ? Math.round((decididas / total) * 100) : 0,
    },
    stats: [
      {
        icone: <IconClipboard className="h-4 w-4 text-amber-500" />,
        valor: edital.pendentes,
        label: 'Aguardando',
        cor: 'text-amber-600',
      },
      {
        icone: <IconCheck className="h-4 w-4 text-emerald-500" />,
        valor: edital.habilitadas,
        label: 'Habilitadas / Aptas',
        cor: 'text-emerald-600',
      },
      {
        icone: <IconClose className="h-4 w-4 text-rose-500" />,
        valor: edital.inabilitadas,
        label: 'Inabilitadas / Inaptas',
        cor: 'text-rose-600',
      },
    ],
  }
}

export function EditalPicker({ editais }: { editais: EditalHabilitacaoCard[] }) {
  const totalPendentes = editais
    .filter((e) => e.status === 'HABILITACAO')
    .reduce((acc, e) => acc + e.pendentes, 0)

  return (
    <EditalPickerBase
      titulo="Conferência e Habilitação Documental"
      descricao="Selecione um edital para conferir a documentação e validar as inscrições aptas para análise e avaliação. Cada edital tem sua própria fila — evita misturar a conferência de um edital com a de outro."
      icone={<IconShield className="h-6 w-6" />}
      editais={editais.map(paraCard)}
      resumoAtivos={
        totalPendentes > 0
          ? `${totalPendentes} ${totalPendentes === 1 ? 'inscrição aguardando' : 'inscrições aguardando'}`
          : 'tudo conferido'
      }
    />
  )
}
