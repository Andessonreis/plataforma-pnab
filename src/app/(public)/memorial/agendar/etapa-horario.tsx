'use client'

import { useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@/components/ui'
import { diaEmIrece, formatarDiaPorExtenso } from '@/lib/memorial/agendamento/datas'
import type { DadosVisita } from './dados-visita'
import type { RegrasPublicas } from './fluxo-agendamento'
import { BotoesEtapa } from './botoes-etapa'
import { CalendarioVisitas } from './calendario-visitas'
import { EsqueletoCalendario } from './esqueleto-calendario'
import { HorariosDoDia } from './horarios-do-dia'
import { proximoMes, useDisponibilidade, type AgendaDoMes, type CacheAgenda } from './use-disponibilidade'

interface EtapaHorarioProps {
  dados: DadosVisita
  regras: RegrasPublicas
  cache: CacheAgenda
  /** Aviso vindo do envio (ex.: horário tomado por outro grupo), mostrado no topo da etapa. */
  aviso?: string
  aoEscolher: (parcial: Partial<DadosVisita>) => void
  aoVoltar: () => void
  aoContinuar: () => void
}

const nomeDoMes = (mes: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-15T12:00:00Z`))

const NAV = 'flex h-11 w-11 items-center justify-center border-2 border-tinta-900/20 text-tinta-900 hover:border-tinta-900 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700'

export function EtapaHorario({ dados, regras, cache, aviso, aoEscolher, aoVoltar, aoContinuar }: EtapaHorarioProps) {
  const hoje = diaEmIrece(new Date())
  const mesAtual = hoje.slice(0, 7)
  const [mes, setMes] = useState(dados.data ? dados.data.slice(0, 7) : mesAtual)
  const [erro, setErro] = useState('')
  const { estado, recarregar } = useDisponibilidade(mes, cache)
  const agenda: AgendaDoMes = estado.situacao === 'pronto' ? estado.dias : new Map()
  const horarios = dados.data ? agenda.get(dados.data) ?? [] : []
  const temLivre = [...agenda.values()].some((hs) => hs.some((h) => h.motivo === null))

  function continuar() {
    if (!dados.horaInicio) return setErro('Escolha um dia e um horário para continuar.')
    // A agenda é reconsultada em segundo plano; se o horário escolhido foi tomado nesse meio-tempo, avisa já aqui.
    if (!horarios.some((h) => h.inicio === dados.horaInicio && h.motivo === null)) {
      aoEscolher({ turno: '', horaInicio: '', horaFim: '' })
      return setErro('Esse horário acabou de ser ocupado. Escolha outro.')
    }
    aoContinuar()
  }

  return (
    <div>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">Escolha a data e o horário</h2>
      <p className="mt-2 text-sm leading-relaxed text-tinta-700">
        Os dias com borda verde têm pelo menos um horário livre. Dias riscados não aceitam pedido: já passaram, ficam a
        menos de {regras.antecedenciaHoras} horas, não têm visitação naquele dia da semana ou já estão com todos os
        horários reservados. Ao escolher um dia, os horários já tomados aparecem riscados, com o motivo.
      </p>
      {aviso && (
        <p role="alert" className="mt-4 border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {aviso}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" className={NAV} onClick={() => setMes(proximoMes(mes, -1))} disabled={mes <= mesAtual} aria-label="Mês anterior">
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold capitalize text-tinta-900" aria-live="polite">
          {nomeDoMes(mes)}
        </p>
        <button type="button" className={NAV} onClick={() => setMes(proximoMes(mes))} aria-label="Próximo mês">
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 min-h-[280px]">
        {estado.situacao === 'carregando' && <EsqueletoCalendario mes={mes} />}
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
              agenda={agenda}
              hoje={hoje}
              antecedenciaHoras={regras.antecedenciaHoras}
              selecionado={dados.data}
              aoSelecionar={(data) => {
                setErro('')
                aoEscolher({ data, turno: '', horaInicio: '', horaFim: '' })
              }}
            />
            {!temLivre && <p className="mt-4 text-sm text-tinta-700">Nenhum horário livre neste mês. Veja o mês seguinte.</p>}
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
