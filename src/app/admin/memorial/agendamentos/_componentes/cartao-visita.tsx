import Link from 'next/link'
import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'
import { formatTelefoneBR } from '@/lib/utils/format'
import { dateParaDia, formatarDiaCurto } from '@/lib/memorial/agendamento/datas'
import { StatusVisita } from './status-visita'

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

/**
 * Cartão de uma visita com tudo o que a equipe precisa para ligar ou responder sem abrir
 * o detalhe. `compacto` some com o contato, para caber numa célula do calendário.
 */
export function CartaoVisita({ visita: v, compacto = false, comData = true }: { visita: VisitaCartao; compacto?: boolean; comData?: boolean }) {
  return (
    <Link
      href={`/admin/memorial/agendamentos/${v.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-brand-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {comData && <>{formatarDiaCurto(dateParaDia(v.data))}, </>}
          {v.horaInicio}–{v.horaFim}
        </p>
        <StatusVisita status={v.status} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-slate-800">{v.instituicao}</p>
      <p className="mt-0.5 text-xs text-slate-600">
        {v.quantidade} pessoas, {v.tipoVisitante}
      </p>
      {!compacto && (
        <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
          <p className="font-medium text-slate-700">{v.responsavelNome}</p>
          <p>{formatTelefoneBR(v.responsavelTelefone)}</p>
          <p className="break-all">{v.responsavelEmail}</p>
        </div>
      )}
    </Link>
  )
}
