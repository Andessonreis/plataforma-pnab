import type { ReactNode } from 'react'
import Link from 'next/link'
import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'
import { IconClock, IconUsers } from '@/components/ui'
import { formatTelefoneBR } from '@/lib/utils/format'
import { dateParaDia } from '@/lib/memorial/agendamento/datas'
import { FolhaData } from './FolhaData'
import { StatusChip } from './StatusChip'
import { faltaPara } from './agenda-tempo'

export interface VisitaCartao {
  id: string
  protocolo: string
  status: MemorialStatusAgendamento
  data: Date
  turno: MemorialTurno
  horaInicio: string
  horaFim: string
  instituicao: string
  tipoVisitante: string
  quantidade: number
  responsavelNome: string
  responsavelTelefone: string
  responsavelEmail: string
}

/** Colunas da linha no desktop; o cabeçalho da lista usa a mesma grade para alinhar. */
export const GRADE_VISITA =
  'lg:grid lg:grid-cols-[3.5rem_minmax(0,2fr)_7.5rem_6.5rem_minmax(0,1.3fr)_10rem] lg:items-center lg:gap-x-5'

interface Props {
  visita: VisitaCartao
  hoje: string
  /** Linha extra embaixo (ex.: "Chegou há 3 dias"). */
  nota?: string
  /** Botões que respondem sem abrir o pedido. Ficam acima do link da linha. */
  acoes?: ReactNode
}

/**
 * Uma visita em uma linha: no celular vira cartão empilhado, no desktop vira linha de
 * tabela. A linha toda abre o pedido; os botões de ação ficam por cima do link.
 */
export function VisitaLinha({ visita: v, hoje, nota, acoes }: Props) {
  const dia = dateParaDia(v.data)
  const falta = faltaPara(dia, hoje)
  return (
    <li className={`relative flex gap-3 px-4 py-4 transition-colors hover:bg-papel-50/70 ${GRADE_VISITA}`}>
      <FolhaData data={v.data} className="self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:contents">
        <div className="min-w-0">
          <Link
            href={`/admin/memorial/agendamentos/${v.id}`}
            className="text-base font-bold leading-snug text-tinta-900 after:absolute after:inset-0 hover:text-brand-700 focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-accent-500"
          >
            {v.instituicao}
          </Link>
          <p className="truncate text-sm text-tinta-600">{v.tipoVisitante}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:order-last lg:flex-col lg:items-start lg:gap-1">
          <StatusChip tipo="visita" status={v.status} />
          {falta && <span className="text-xs font-semibold text-tinta-700">{falta}</span>}
          {nota && <span className="text-xs font-semibold text-accent-800">{nota}</span>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-800 lg:contents">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <IconClock className="h-4 w-4 text-tinta-500" />
            {v.horaInicio}–{v.horaFim}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
            <IconUsers className="h-4 w-4 text-tinta-500" />
            {v.quantidade} pessoas
          </span>
        </div>
        <p className="min-w-0 text-xs text-tinta-600 lg:text-sm">
          <span className="block truncate font-semibold text-tinta-800">{v.responsavelNome}</span>
          <span className="tabular-nums">{formatTelefoneBR(v.responsavelTelefone)}</span>
        </p>
        {acoes && <div className="relative z-10 pt-1 lg:order-last lg:col-span-full lg:col-start-2 lg:pt-2">{acoes}</div>}
      </div>
    </li>
  )
}
