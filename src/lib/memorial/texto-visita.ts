import type { Visitacao } from './config'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/** [1,2,3,4,5] → "segunda a sexta"; dias soltos viram lista. */
export function diasDeVisita(dias: number[]): string {
  const ordenados = [...dias].sort((a, b) => a - b)
  const seguidos = ordenados.every((d, i) => i === 0 || d === ordenados[i - 1] + 1)
  if (seguidos && ordenados.length > 2) return `${DIAS[ordenados[0]]} a ${DIAS[ordenados.at(-1)!]}`
  return ordenados.map((d) => DIAS[d]).join(', ')
}

function faixaHorario(h: { inicio: string; fim: string }[]) {
  return h.length ? `${h[0].inicio} às ${h.at(-1)!.fim}` : null
}

/**
 * Regras de visita em frases, montadas a partir das configurações do Memorial.
 * Uma fonte só para a página do Memorial e para o convite da home, para as
 * duas nunca dizerem coisas diferentes.
 */
export function regrasDeVisita(visitacao: Visitacao) {
  const manha = faixaHorario(visitacao.horarios.MANHA)
  const tarde = faixaHorario(visitacao.horarios.TARDE)
  const turnos = [manha && `pela manhã, das ${manha}`, tarde && `à tarde, das ${tarde}`].filter(Boolean).join(', e ')
  return {
    quando: `Visitas em grupo, de ${diasDeVisita(visitacao.diasSemana)}${turnos ? `, ${turnos}` : ''}.`,
    grupo: `Grupos de até ${visitacao.maxPessoasPorGrupo} pessoas.`,
    antecedencia: `Peça com pelo menos ${visitacao.antecedenciaHoras} horas de antecedência.`,
  }
}
