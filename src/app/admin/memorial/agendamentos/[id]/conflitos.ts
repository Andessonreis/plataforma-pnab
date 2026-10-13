import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'
import { ocupaVaga, type RegrasVisita } from '@/lib/memorial/agendamento/regras'
import { ROTULO_STATUS, ROTULO_TURNO } from '@/lib/memorial/agendamento/status'

export interface VisitaDoDia {
  id: string
  instituicao: string
  turno: MemorialTurno
  horaInicio: string
  status: MemorialStatusAgendamento
}

/**
 * Problemas de agenda de uma visita, em frases para a equipe decidir. Só olha o que segura
 * vaga: pedido recusado ou cancelado já liberou o horário e não conta.
 */
export function conflitosDaVisita(
  visita: VisitaDoDia,
  doDia: readonly VisitaDoDia[],
  regras: Pick<RegrasVisita, 'maxGruposPorDia' | 'umTurnoPorDia'>,
): string[] {
  if (!ocupaVaga(visita.status)) return []
  const outras = doDia.filter((o) => o.id !== visita.id && ocupaVaga(o.status))
  const avisos: string[] = []

  for (const o of outras.filter((o) => o.turno === visita.turno && o.horaInicio === visita.horaInicio)) {
    avisos.push(
      `${o.instituicao} também está marcada para as ${o.horaInicio} deste dia (${ROTULO_STATUS[o.status].toLowerCase()}). ` +
        'Dois grupos no mesmo horário: remarque um deles antes de confirmar.',
    )
  }
  if (outras.length + 1 > regras.maxGruposPorDia) {
    avisos.push(`Este dia passa do limite de ${regras.maxGruposPorDia} grupos: há ${outras.length + 1} pedidos segurando vaga.`)
  }
  const outroTurno = outras.find((o) => o.turno !== visita.turno)
  if (regras.umTurnoPorDia && outroTurno) {
    avisos.push(
      `A regra é receber grupos em um turno só por dia, e ${outroTurno.instituicao} já está no turno da ${ROTULO_TURNO[outroTurno.turno].toLowerCase()}.`,
    )
  }
  return avisos
}
