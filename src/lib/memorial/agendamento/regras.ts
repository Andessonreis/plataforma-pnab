import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'
import type { Visitacao } from '@/lib/memorial/config'
import { diaDaSemana, inicioDaVisita } from './datas'

/**
 * Regras de visitação do Memorial, sem acesso a banco: tudo que decide se um horário
 * pode ser pedido mora aqui e é testado isoladamente. Os números (antecedência, tamanho
 * do grupo, grupos por dia, turnos, grade) chegam da configuração editável no painel.
 */

export type RegrasVisita = Pick<
  Visitacao,
  'antecedenciaHoras' | 'maxPessoasPorGrupo' | 'maxGruposPorDia' | 'umTurnoPorDia' | 'diasSemana' | 'horarios'
>

/** Visitas nesses status seguram a vaga; as demais já liberaram o horário. */
export const STATUS_QUE_OCUPAM: readonly MemorialStatusAgendamento[] = [
  'SOLICITADO',
  'EM_ANALISE',
  'CONFIRMADO',
  'REAGENDAMENTO_SOLICITADO',
]

export const TURNOS: readonly MemorialTurno[] = ['MANHA', 'TARDE']

export interface Ocupacao {
  data: string
  turno: MemorialTurno
  horaInicio: string
  status: MemorialStatusAgendamento
}

export interface PedidoHorario {
  data: string
  turno: MemorialTurno
  horaInicio: string
  horaFim: string
}

export interface Horario {
  turno: MemorialTurno
  inicio: string
  fim: string
}

export type MotivoIndisponivel =
  | 'ANTECEDENCIA'
  | 'GRUPO_GRANDE'
  | 'DIA_FECHADO'
  | 'FORA_DA_GRADE'
  | 'DIA_LOTADO'
  | 'OUTRO_TURNO_OCUPADO'
  | 'HORARIO_OCUPADO'

export function ocupaVaga(status: MemorialStatusAgendamento): boolean {
  return STATUS_QUE_OCUPAM.includes(status)
}

export function cumpreAntecedencia(dia: string, hora: string, agora: Date, horas: number): boolean {
  return inicioDaVisita(dia, hora).getTime() - agora.getTime() >= horas * 3_600_000
}

export function cabeNoGrupo(quantidade: number, maxPessoas: number): boolean {
  return Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= maxPessoas
}

export function diaAbertoParaVisita(dia: string, diasSemana: readonly number[]): boolean {
  return diasSemana.includes(diaDaSemana(dia))
}

export function horarioDaGrade(pedido: Omit<PedidoHorario, 'data'>, horarios: RegrasVisita['horarios']): boolean {
  return horarios[pedido.turno].some((h) => h.inicio === pedido.horaInicio && h.fim === pedido.horaFim)
}

/** Ocupações que de fato seguram vaga naquele dia. */
export function ocupacoesDoDia(ocupacoes: readonly Ocupacao[], dia: string): Ocupacao[] {
  return ocupacoes.filter((o) => o.data === dia && ocupaVaga(o.status))
}

export function diaLotado(ocupadasNoDia: readonly Ocupacao[], maxGrupos: number): boolean {
  return ocupadasNoDia.length >= maxGrupos
}

/** Com um turno por dia, a primeira visita do dia fecha o outro turno. */
export function turnoBloqueado(ocupadasNoDia: readonly Ocupacao[], turno: MemorialTurno, umTurnoPorDia: boolean): boolean {
  if (!umTurnoPorDia) return false
  return ocupadasNoDia.some((o) => o.turno !== turno)
}

export function horarioOcupado(ocupadasNoDia: readonly Ocupacao[], turno: MemorialTurno, inicio: string): boolean {
  return ocupadasNoDia.some((o) => o.turno === turno && o.horaInicio === inicio)
}

interface OpcoesValidacao {
  /** A equipe pode remarcar em cima da hora; o visitante não. */
  ignorarAntecedencia?: boolean
}

/**
 * Primeiro motivo pelo qual o pedido não pode ser aceito, ou null se está tudo certo.
 * A ordem segue o que a pessoa consegue corrigir primeiro (grupo, dia, horário).
 */
export function motivoIndisponivel(
  pedido: PedidoHorario & { quantidade: number },
  ocupacoes: readonly Ocupacao[],
  regras: RegrasVisita,
  agora: Date,
  opcoes: OpcoesValidacao = {},
): MotivoIndisponivel | null {
  if (!cabeNoGrupo(pedido.quantidade, regras.maxPessoasPorGrupo)) return 'GRUPO_GRANDE'
  if (!diaAbertoParaVisita(pedido.data, regras.diasSemana)) return 'DIA_FECHADO'
  if (!horarioDaGrade(pedido, regras.horarios)) return 'FORA_DA_GRADE'
  if (!opcoes.ignorarAntecedencia && !cumpreAntecedencia(pedido.data, pedido.horaInicio, agora, regras.antecedenciaHoras)) {
    return 'ANTECEDENCIA'
  }
  const doDia = ocupacoesDoDia(ocupacoes, pedido.data)
  if (horarioOcupado(doDia, pedido.turno, pedido.horaInicio)) return 'HORARIO_OCUPADO'
  if (diaLotado(doDia, regras.maxGruposPorDia)) return 'DIA_LOTADO'
  if (turnoBloqueado(doDia, pedido.turno, regras.umTurnoPorDia)) return 'OUTRO_TURNO_OCUPADO'
  return null
}

/** Por que um horário da grade não pode ser escolhido; null quando está livre. */
export type MotivoHorario = 'RESERVADO' | 'ANTECEDENCIA' | 'DIA_LOTADO' | 'OUTRO_TURNO'

export interface SituacaoHorario extends Horario {
  motivo: MotivoHorario | null
}

/**
 * Toda a grade do dia, cada horário com o motivo de estar indisponível. Assim a tela
 * mostra o que está tomado em vez de esconder, e o dia só fica fechado quando nada sobra.
 * Dia da semana sem visitação devolve lista vazia.
 */
export function situacaoDosHorarios(dia: string, ocupacoes: readonly Ocupacao[], regras: RegrasVisita, agora: Date): SituacaoHorario[] {
  if (!diaAbertoParaVisita(dia, regras.diasSemana)) return []
  const doDia = ocupacoesDoDia(ocupacoes, dia)
  const lotado = diaLotado(doDia, regras.maxGruposPorDia)

  return TURNOS.flatMap((turno) =>
    regras.horarios[turno].map((h): SituacaoHorario => {
      const motivo: MotivoHorario | null = horarioOcupado(doDia, turno, h.inicio)
        ? 'RESERVADO'
        : !cumpreAntecedencia(dia, h.inicio, agora, regras.antecedenciaHoras)
          ? 'ANTECEDENCIA'
          : lotado
            ? 'DIA_LOTADO'
            : turnoBloqueado(doDia, turno, regras.umTurnoPorDia)
              ? 'OUTRO_TURNO'
              : null
      return { turno, inicio: h.inicio, fim: h.fim, motivo }
    }),
  )
}

/** Horários ainda livres num dia, já descontando antecedência, lotação e turno. */
export function horariosLivres(dia: string, ocupacoes: readonly Ocupacao[], regras: RegrasVisita, agora: Date): Horario[] {
  return situacaoDosHorarios(dia, ocupacoes, regras, agora)
    .filter((h) => h.motivo === null)
    .map(({ turno, inicio, fim }) => ({ turno, inicio, fim }))
}

/** Rótulo curto que aparece no lugar do horário indisponível. */
export function rotuloMotivoHorario(motivo: MotivoHorario, turno: MemorialTurno): string {
  switch (motivo) {
    case 'RESERVADO':
      return 'Reservado'
    case 'ANTECEDENCIA':
      return 'Antecedência mínima'
    case 'DIA_LOTADO':
      return 'Limite de grupos no dia'
    case 'OUTRO_TURNO':
      return turno === 'MANHA' ? 'Turno da tarde já tem visita' : 'Turno da manhã já tem visita'
  }
}

export function mensagemIndisponivel(motivo: MotivoIndisponivel, regras: RegrasVisita): string {
  switch (motivo) {
    case 'ANTECEDENCIA':
      return `A visita precisa ser pedida com pelo menos ${regras.antecedenciaHoras} horas de antecedência.`
    case 'GRUPO_GRANDE':
      return `Cada agendamento atende até ${regras.maxPessoasPorGrupo} pessoas. Para grupos maiores, divida em mais de um horário ou fale com a equipe.`
    case 'DIA_FECHADO':
      return 'O Memorial não recebe visitas agendadas nesse dia da semana.'
    case 'FORA_DA_GRADE':
      return 'Esse horário não faz parte da grade de visitas.'
    case 'DIA_LOTADO':
      return 'Esse dia já atingiu o limite de grupos. Escolha outra data.'
    case 'OUTRO_TURNO_OCUPADO':
      return 'Esse dia já tem visita no outro turno. Escolha um horário do mesmo turno ou outra data.'
    case 'HORARIO_OCUPADO':
      return 'Esse horário acabou de ser ocupado por outro grupo. Escolha outro horário.'
  }
}
