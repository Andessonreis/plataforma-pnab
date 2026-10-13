import Link from 'next/link'
import { ROTULO_STATUS } from '@/lib/memorial/agendamento/status'
import { diaDaSemana } from '@/lib/memorial/agendamento/datas'
import { BLOCO_VISITA } from './agenda-cores'
import type { VisitaCartao } from './agenda-visita'

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

interface Props {
  dias: { dia: string; visitas: VisitaCartao[] }[]
  hoje: string
  /** Link do número do dia (ex.: abrir a agenda daquele dia). */
  urlDoDia?: (dia: string) => string
}

/** Bloco de uma visita: horário, grupo, tamanho e situação, colorido pela situação. */
export function BlocoVisita({ visita: v }: { visita: VisitaCartao }) {
  return (
    <Link
      href={`/admin/memorial/agendamentos/${v.id}`}
      className={`block rounded-md border px-2 py-1.5 text-xs leading-snug hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500 ${BLOCO_VISITA[v.status]}`}
    >
      <span className="flex items-baseline justify-between gap-2 font-bold tabular-nums">
        {v.horaInicio}
        <span className="font-semibold">{v.quantidade} pes.</span>
      </span>
      <span className="mt-0.5 line-clamp-2 font-semibold">{v.instituicao}</span>
      <span className="mt-0.5 block text-[11px] font-medium opacity-90">{ROTULO_STATUS[v.status]}</span>
    </Link>
  )
}

/**
 * Linha do tempo de uma semana. No celular cada dia é uma faixa; no desktop, uma coluna.
 * Dias sem visita aparecem esmaecidos para a semana ser lida inteira, sem buracos.
 */
export function SemanaVisitas({ dias, hoje, urlDoDia }: Props) {
  return (
    <ol className="divide-y divide-tinta-900/10 lg:grid lg:grid-cols-7 lg:divide-x lg:divide-y-0">
      {dias.map(({ dia, visitas }) => {
        const ehHoje = dia === hoje
        const vazio = visitas.length === 0
        const semana = diaDaSemana(dia)
        const pessoas = visitas.reduce((s, v) => s + v.quantidade, 0)
        const classeCabeca = `flex min-h-[44px] w-14 shrink-0 items-center justify-center rounded-lg lg:w-full lg:flex-row lg:justify-between lg:px-2 lg:py-1.5 ${
          vazio ? 'flex-row gap-1.5 py-1' : 'flex-col gap-1 py-1.5'
        } ${
          ehHoje ? 'bg-brand-600 text-white' : vazio ? 'text-tinta-500' : 'text-tinta-900'
        }`
        const numero = (
          <>
            <span className="text-xs font-semibold uppercase">
              {ehHoje && <span className="sr-only">Hoje, </span>}
              {DIAS_CURTOS[semana]}
            </span>
            <span className={`font-bold leading-none tabular-nums ${vazio ? 'text-base lg:text-xl' : 'text-xl'}`}>{Number(dia.slice(8))}</span>
          </>
        )
        return (
          <li key={dia} className={`flex gap-3 ${vazio ? 'py-1.5' : 'py-3'} lg:min-h-[12rem] lg:flex-col lg:gap-2 lg:px-2 lg:py-2 ${vazio ? 'bg-papel-50/60' : ''}`}>
            {urlDoDia ? (
              <Link href={urlDoDia(dia)} className={`${classeCabeca} hover:ring-1 hover:ring-tinta-900/20`} aria-label={`Abrir a agenda de ${DIAS_LONGOS[semana]}, dia ${Number(dia.slice(8))}`}>
                {numero}
              </Link>
            ) : (
              <div className={classeCabeca}>{numero}</div>
            )}
            {vazio ? (
              <p className="self-center text-sm text-tinta-500 lg:self-start lg:px-1 lg:text-xs">Sem visitas</p>
            ) : (
              <div className="min-w-0 flex-1 space-y-1.5">
                <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                  {visitas.map((v) => (
                    <li key={v.id}>
                      <BlocoVisita visita={v} />
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold text-tinta-700 lg:px-1">{pessoas} pessoas no dia</p>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
