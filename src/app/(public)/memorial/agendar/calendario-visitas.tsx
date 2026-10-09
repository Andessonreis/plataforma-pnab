'use client'

import { useRef, type KeyboardEvent } from 'react'
import { diaDaSemana, diasEntre, intervaloDoMes } from '@/lib/memorial/agendamento/datas'
import type { AgendaDoMes } from './use-disponibilidade'

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const SEMANA_EXTENSO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

interface CalendarioVisitasProps {
  mes: string
  /** Dias de visitação do mês, de hoje em diante, com a situação de cada horário. */
  agenda: AgendaDoMes
  /** Hoje em Irecê ("AAAA-MM-DD"). */
  hoje: string
  antecedenciaHoras: number
  selecionado: string
  aoSelecionar: (dia: string) => void
}

/** Por que o dia não aceita pedido, dito do jeito que a pessoa entende; vazio quando aceita. */
function motivoDoDia(dia: string, agenda: AgendaDoMes, hoje: string, antecedenciaHoras: number): string {
  if (dia < hoje) return 'data que já passou'
  const horarios = agenda.get(dia)
  if (!horarios) return 'sem visitação neste dia da semana'
  if (horarios.some((h) => h.motivo === null)) return ''
  if (horarios.every((h) => h.motivo === 'ANTECEDENCIA')) return `pedido precisa de ${antecedenciaHoras} horas de antecedência`
  if (horarios.some((h) => h.motivo === 'DIA_LOTADO')) return 'limite de grupos do dia atingido'
  return 'todos os horários já reservados'
}

function rotuloDia(dia: string, motivo: string) {
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`))
  return `${Number(dia.slice(8))} de ${nomeMes}, ${SEMANA_EXTENSO[diaDaSemana(dia)]}${motivo ? `, ${motivo}` : ''}`
}

/**
 * Grade do mês em que só os dias com pelo menos um horário livre são botões; os demais
 * dizem ao leitor de tela (e no `title`) por que estão fechados. As setas andam entre
 * esses dias (esquerda/direita: anterior/próximo livre; cima/baixo: mesma coluna),
 * e só um deles fica na ordem do Tab, como pede o padrão de grade do WAI-ARIA.
 */
export function CalendarioVisitas({ mes, agenda, hoje, antecedenciaHoras, selecionado, aoSelecionar }: CalendarioVisitasProps) {
  const { de, ate } = intervaloDoMes(mes)
  const dias = diasEntre(de, ate)
  const motivos = new Map(dias.map((d) => [d, motivoDoDia(d, agenda, hoje, antecedenciaHoras)]))
  const disponiveis = dias.filter((d) => !motivos.get(d))
  const foco = disponiveis.includes(selecionado) ? selecionado : disponiveis[0]
  const botoes = useRef(new Map<string, HTMLButtonElement>())

  function mover(e: KeyboardEvent, dia: string) {
    const i = disponiveis.indexOf(dia)
    const alvo = (() => {
      switch (e.key) {
        case 'ArrowRight':
          return disponiveis[i + 1]
        case 'ArrowLeft':
          return disponiveis[i - 1]
        case 'ArrowDown':
          return disponiveis.find((d) => d > dia && diaDaSemana(d) === diaDaSemana(dia)) ?? disponiveis[i + 1]
        case 'ArrowUp':
          return [...disponiveis].reverse().find((d) => d < dia && diaDaSemana(d) === diaDaSemana(dia)) ?? disponiveis[i - 1]
        case 'Home':
          return disponiveis[0]
        case 'End':
          return disponiveis[disponiveis.length - 1]
      }
    })()
    if (!alvo) return
    e.preventDefault()
    botoes.current.get(alvo)?.focus()
  }

  return (
    <div role="group" aria-label="Dias do mês">
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-tinta-600" aria-hidden="true">
        {SEMANA.map((s, i) => (
          <span key={i} className="py-2">
            {s}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: diaDaSemana(de) }, (_, i) => (
          <span key={`vazio-${i}`} aria-hidden="true" />
        ))}
        {dias.map((dia) => {
          const numero = Number(dia.slice(8))
          const motivo = motivos.get(dia) ?? ''
          if (motivo) {
            return (
              <span
                key={dia}
                title={motivo}
                className="flex h-11 items-center justify-center text-sm text-tinta-900/50 line-through decoration-tinta-900/30"
              >
                <span aria-hidden="true">{numero}</span>
                <span className="sr-only">{rotuloDia(dia, motivo)}</span>
              </span>
            )
          }
          const ativo = dia === selecionado
          return (
            <button
              key={dia}
              ref={(el) => {
                if (el) botoes.current.set(dia, el)
                else botoes.current.delete(dia)
              }}
              type="button"
              tabIndex={dia === foco ? 0 : -1}
              aria-pressed={ativo}
              aria-label={rotuloDia(dia, '')}
              onClick={() => aoSelecionar(dia)}
              onKeyDown={(e) => mover(e, dia)}
              className={[
                'flex h-11 items-center justify-center border-2 text-sm font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700',
                ativo
                  ? 'border-turquesa-800 bg-turquesa-800 text-white'
                  : 'border-oliva-700/40 bg-oliva-50 text-oliva-900 hover:border-oliva-700',
              ].join(' ')}
            >
              {numero}
            </button>
          )
        })}
      </div>
    </div>
  )
}
