import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import type { MemorialStatusAgendamento } from '@prisma/client'

interface FiltrosVisitasProps {
  /** Parâmetros que precisam sobreviver ao envio (visão, escala, referência). */
  fixos: Record<string, string | undefined>
  status?: string
  busca?: string
  de?: string
  ate?: string
  /** No calendário o período é a própria tela, então os campos de data somem. */
  comPeriodo?: boolean
}

const CAMPO =
  'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

/** Filtros por link/GET: funcionam sem JavaScript e a URL pode ser compartilhada. */
export function FiltrosVisitas({ fixos, status, busca, de, ate, comPeriodo = true }: FiltrosVisitasProps) {
  return (
    <form action="/admin/memorial/agendamentos" role="search" className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
      {Object.entries(fixos).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <label className="text-xs font-medium text-slate-600">
        Buscar
        <input name="busca" type="search" defaultValue={busca} placeholder="Protocolo, instituição, responsável ou e-mail" className={`mt-1 ${CAMPO}`} />
      </label>
      <label className="text-xs font-medium text-slate-600">
        Situação
        <select name="status" defaultValue={status ?? ''} className={`mt-1 ${CAMPO}`}>
          <option value="">Todas</option>
          {(Object.keys(ROTULO_STATUS) as MemorialStatusAgendamento[]).map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS[s]}
            </option>
          ))}
        </select>
      </label>
      {comPeriodo && (
        <>
          <label className="text-xs font-medium text-slate-600">
            De
            <input name="de" type="date" defaultValue={de} className={`mt-1 ${CAMPO}`} />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Até
            <input name="ate" type="date" defaultValue={ate} className={`mt-1 ${CAMPO}`} />
          </label>
        </>
      )}
      <button type="submit" className="min-h-[44px] rounded-lg bg-slate-800 px-5 text-sm font-medium text-white hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800">
        Filtrar
      </button>
    </form>
  )
}
