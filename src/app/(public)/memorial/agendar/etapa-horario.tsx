'use client'

import { useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@/components/ui'
import { diaEmIrece, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import type { DadosVisita } from './dados-visita'
import { BotoesEtapa } from './botoes-etapa'
import { CalendarioVisitas } from './calendario-visitas'
import { HorariosDoDia } from './horarios-do-dia'
import { useDisponibilidade } from './use-disponibilidade'

interface EtapaHorarioProps {
  dados: DadosVisita
  aoEscolher: (parcial: Partial<DadosVisita>) => void
  aoVoltar: () => void
  aoContinuar: () => void
}

function somarMes(mes: string, n: number) {
  const d = new Date(`${mes}-01T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 7)
}

const nomeDoMes = (mes: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-15T12:00:00Z`))

const NAV = 'flex h-11 w-11 items-center justify-center border-2 border-tinta-900/20 text-tinta-900 hover:border-tinta-900 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700'

export function EtapaHorario({ dados, aoEscolher, aoVoltar, aoContinuar }: EtapaHorarioProps) {
  const mesAtual = diaEmIrece(new Date()).slice(0, 7)
  const [mes, setMes] = useState(dados.data ? dados.data.slice(0, 7) : mesAtual)
  const [erro, setErro] = useState('')
  const { estado, recarregar } = useDisponibilidade(mes)
  const dias = estado.situacao === 'pronto' ? estado.dias : new Map()
  const horarios = dados.data ? dias.get(dados.data) ?? [] : []

  function continuar() {
    if (!dados.horaInicio) return setErro('Escolha um dia e um horário para continuar.')
    aoContinuar()
  }

  return (
    <div>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">Escolha a data e o horário</h2>
      <p className="mt-2 text-sm leading-relaxed text-tinta-700">
        Os dias em verde ainda têm horário livre. Dias riscados estão fechados ou já lotados.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" className={NAV} onClick={() => setMes(somarMes(mes, -1))} disabled={mes <= mesAtual} aria-label="Mês anterior">
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold capitalize text-tinta-900" aria-live="polite">
          {nomeDoMes(mes)}
        </p>
        <button type="button" className={NAV} onClick={() => setMes(somarMes(mes, 1))} aria-label="Próximo mês">
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 min-h-[280px]">
        {estado.situacao === 'carregando' && <p className="py-10 text-center text-sm text-tinta-600">Consultando a agenda…</p>}
        {estado.situacao === 'erro' && (
          <div className="py-8 text-center text-sm text-red-800">
            <p>{estado.mensagem}</p>
            <button type="button" onClick={recarregar} className="mt-3 min-h-[44px] underline underline-offset-4">
              Tentar de novo
            </button>
          </div>
        )}
        {estado.situacao === 'pronto' && (
          <>
            <CalendarioVisitas
              mes={mes}
              livres={new Set(dias.keys())}
              selecionado={dados.data}
              aoSelecionar={(data) => {
                setErro('')
                aoEscolher({ data, turno: '', horaInicio: '', horaFim: '' })
              }}
            />
            {dias.size === 0 && (
              <p className="mt-4 text-sm text-tinta-700">Nenhum horário livre neste mês. Veja o mês seguinte.</p>
            )}
          </>
        )}
      </div>

      {dados.data && horarios.length > 0 && (
        <HorariosDoDia
          titulo={formatarDiaPorExtenso(dados.data)}
          horarios={horarios}
          escolhido={dados.horaInicio}
          aoEscolher={(h) => {
            setErro('')
            aoEscolher({ turno: h.turno, horaInicio: h.inicio, horaFim: h.fim })
          }}
        />
      )}

      {erro && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-800">
          {erro}
        </p>
      )}
      <BotoesEtapa aoVoltar={aoVoltar} aoContinuar={continuar} />
    </div>
  )
}
