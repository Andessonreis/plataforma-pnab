import Link from 'next/link'
import type { MemorialStatusAgendamento } from '@prisma/client'
import { IconChevronDown } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { botaoPrimario, campo, linkDiscreto, rotuloCampo } from '@/app/admin/memorial/_ui'

interface FiltrosVisitasProps {
  /** Parâmetros que precisam sobreviver ao envio (aba, visão, escala, referência). */
  fixos: Record<string, string | undefined>
  status?: string
  busca?: string
  de?: string
  ate?: string
  /** Situação só faz sentido onde a aba não fixa a situação. */
  comSituacao?: boolean
  /** No calendário o período é a própria tela, então os campos de data somem. */
  comPeriodo?: boolean
}

/**
 * Filtros recolhidos num painel que abre ao toque. Funcionam por GET, sem JavaScript, e a
 * URL pode ser enviada a outra pessoa da equipe. Com filtro ativo, o painel já vem aberto.
 */
export function FiltrosVisitas({ fixos, status, busca, de, ate, comSituacao = true, comPeriodo = true }: FiltrosVisitasProps) {
  const ativos = [busca, comSituacao && status, comPeriodo && de, comPeriodo && ate].filter(Boolean).length
  return (
    <details open={ativos > 0} className="group rounded-xl border border-tinta-900/15 bg-white">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold text-tinta-900 focus-visible:outline-2 focus-visible:outline-accent-500 [&::-webkit-details-marker]:hidden">
        <span>
          Buscar e filtrar
          {ativos > 0 && <span className="ml-2 rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-tinta-950">{ativos} ativo{ativos > 1 ? 's' : ''}</span>}
        </span>
        <IconChevronDown className="h-5 w-5 text-tinta-600 transition-transform group-open:rotate-180" />
      </summary>

      <form action="/admin/memorial/agendamentos" role="search" className="grid gap-3 border-t border-tinta-900/10 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        {Object.entries(fixos).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        <label className="sm:col-span-2">
          <span className={rotuloCampo}>Instituição, responsável, e-mail ou protocolo</span>
          <input name="busca" type="search" defaultValue={busca} className={campo} />
        </label>
        {comSituacao && (
          <label>
            <span className={rotuloCampo}>Situação</span>
            <select name="status" defaultValue={status ?? ''} className={campo}>
              <option value="">Todas</option>
              {(Object.keys(ROTULO_STATUS) as MemorialStatusAgendamento[]).map((s) => (
                <option key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </option>
              ))}
            </select>
          </label>
        )}
        {comPeriodo && (
          <>
            <label>
              <span className={rotuloCampo}>Visitas a partir de</span>
              <input name="de" type="date" defaultValue={de} className={campo} />
            </label>
            <label>
              <span className={rotuloCampo}>Até</span>
              <input name="ate" type="date" defaultValue={ate} className={campo} />
            </label>
          </>
        )}
        <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
          <button type="submit" className={botaoPrimario}>
            Aplicar
          </button>
          {ativos > 0 && (
            <Link href={montarUrl('/admin/memorial/agendamentos', fixos)} className={`${linkDiscreto} py-2`}>
              Limpar filtros
            </Link>
          )}
        </div>
      </form>
    </details>
  )
}
