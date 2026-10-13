import type { MemorialStatusAgendamento, StatusConteudo } from '@prisma/client'
import { ROTULO_STATUS as ROTULO_CONTEUDO } from '@/lib/memorial/rotulos'
import { ROTULO_STATUS as ROTULO_VISITA } from '@/lib/memorial/agendamento/status'

/**
 * Cor = significado, nunca enfeite:
 * dourado = a equipe precisa agir · turquesa = em andamento · oliva = no ar ou confirmado
 * ameixa = encerrado · marrom neutro = rascunho · terracota = recusado.
 */
const CORES_CONTEUDO: Record<StatusConteudo, { chip: string; ponto: string }> = {
  RASCUNHO: { chip: 'bg-tinta-900/5 text-tinta-700 ring-tinta-900/15', ponto: 'bg-tinta-400' },
  EM_REVISAO: { chip: 'bg-accent-100 text-accent-900 ring-accent-300', ponto: 'bg-accent-500' },
  APROVADO: { chip: 'bg-turquesa-100 text-turquesa-800 ring-turquesa-300', ponto: 'bg-turquesa-500' },
  PUBLICADO: { chip: 'bg-oliva-100 text-oliva-800 ring-oliva-300', ponto: 'bg-oliva-600' },
  ARQUIVADO: { chip: 'bg-ameixa-100 text-ameixa-700 ring-ameixa-300', ponto: 'bg-ameixa-400' },
}

const CORES_VISITA: Record<MemorialStatusAgendamento, { chip: string; ponto: string }> = {
  SOLICITADO: { chip: 'bg-accent-100 text-accent-900 ring-accent-300', ponto: 'bg-accent-500' },
  EM_ANALISE: { chip: 'bg-turquesa-100 text-turquesa-800 ring-turquesa-300', ponto: 'bg-turquesa-500' },
  CONFIRMADO: { chip: 'bg-oliva-100 text-oliva-800 ring-oliva-300', ponto: 'bg-oliva-600' },
  REALIZADO: { chip: 'bg-oliva-50 text-oliva-700 ring-oliva-200', ponto: 'bg-oliva-400' },
  RECUSADO: { chip: 'bg-brand-50 text-brand-800 ring-brand-200', ponto: 'bg-brand-500' },
  CANCELADO: { chip: 'bg-ameixa-100 text-ameixa-700 ring-ameixa-300', ponto: 'bg-ameixa-400' },
  NAO_COMPARECEU: { chip: 'bg-ameixa-100 text-ameixa-700 ring-ameixa-300', ponto: 'bg-ameixa-400' },
  REAGENDAMENTO_SOLICITADO: { chip: 'bg-accent-100 text-accent-900 ring-accent-300', ponto: 'bg-accent-500' },
}

type Props =
  | { tipo: 'conteudo'; status: StatusConteudo; className?: string }
  | { tipo: 'visita'; status: MemorialStatusAgendamento; className?: string }

/** Situação em chip com ponto colorido e texto: a cor nunca é a única pista. */
export function StatusChip(props: Props) {
  const { chip, ponto } =
    props.tipo === 'conteudo' ? CORES_CONTEUDO[props.status] : CORES_VISITA[props.status]
  const texto = props.tipo === 'conteudo' ? ROTULO_CONTEUDO[props.status] : ROTULO_VISITA[props.status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${chip} ${props.className ?? ''}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${ponto}`} />
      {texto}
    </span>
  )
}
