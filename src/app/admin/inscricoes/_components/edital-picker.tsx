import type { EditalStatus } from '@prisma/client'
import { IconClipboard, IconDocument, IconCheck } from '@/components/ui'
import { EditalPicker as EditalPickerBase, type EditalPickerCard } from '@/components/edital-picker'

/** Um edital na seleção, com o resumo das inscrições dele. */
export interface EditalInscricoesCard {
  id: string
  titulo: string
  ano: number
  status: EditalStatus
  rascunhos: number
  enviadas: number
  /** Inscrições que já saíram da triagem (habilitadas, avaliadas, resultado). */
  emAndamento: number
}

const FASES_COM_INSCRICAO_VIVA: EditalStatus[] = [
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
]

function paraCard(edital: EditalInscricoesCard): EditalPickerCard {
  return {
    id: edital.id,
    titulo: edital.titulo,
    ano: edital.ano,
    ativo: FASES_COM_INSCRICAO_VIVA.includes(edital.status),
    href: `/admin/inscricoes?editalId=${edital.id}`,
    stats: [
      {
        icone: <IconDocument className="h-4 w-4 text-slate-400" />,
        valor: edital.rascunhos,
        label: 'Rascunhos',
        cor: 'text-slate-600',
      },
      {
        icone: <IconClipboard className="h-4 w-4 text-brand-500" />,
        valor: edital.enviadas,
        label: 'Enviadas',
        cor: 'text-brand-600',
      },
      {
        icone: <IconCheck className="h-4 w-4 text-emerald-500" />,
        valor: edital.emAndamento,
        label: 'Em andamento',
        cor: 'text-emerald-600',
      },
    ],
  }
}

export function InscricoesEditalPicker({ editais }: { editais: EditalInscricoesCard[] }) {
  const totalEnviadas = editais.reduce((acc, e) => acc + e.enviadas, 0)

  return (
    <EditalPickerBase
      titulo="Inscrições"
      descricao="Selecione um edital para ver as inscrições dele. Cada edital tem sua própria lista — misturar processos de editais diferentes numa lista só torna a triagem inviável."
      icone={<IconClipboard className="h-6 w-6" />}
      editais={editais.map(paraCard)}
      resumoAtivos={
        totalEnviadas > 0
          ? `${totalEnviadas} ${totalEnviadas === 1 ? 'inscrição enviada' : 'inscrições enviadas'}`
          : 'nenhuma inscrição enviada ainda'
      }
    />
  )
}
