export type Horario = { inicio: string; fim: string }

/** A regra é gravada em horas; na tela a equipe pensa em dias e horas. */
export function separarAntecedencia(horas: number): { dias: number; horas: number } {
  return { dias: Math.floor(horas / 24), horas: horas % 24 }
}

export function juntarAntecedencia(dias: number, horas: number): number {
  return Math.max(0, Math.trunc(dias)) * 24 + Math.max(0, Math.trunc(horas))
}

function emMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function emHora(minutos: number): string {
  const limitado = Math.min(minutos, 23 * 60 + 59)
  return `${String(Math.floor(limitado / 60)).padStart(2, '0')}:${String(limitado % 60).padStart(2, '0')}`
}

/**
 * Próxima faixa sugerida ao clicar em "Adicionar horário": começa onde a última
 * termina e dura o mesmo que ela. Turno vazio começa no horário padrão do turno.
 */
export function proximaFaixa(horarios: Horario[], inicioPadrao: string, duracaoPadrao = 45): Horario {
  const ultima = horarios.at(-1)
  if (!ultima) return { inicio: inicioPadrao, fim: emHora(emMinutos(inicioPadrao) + duracaoPadrao) }
  const duracao = emMinutos(ultima.fim) - emMinutos(ultima.inicio)
  const inicio = emMinutos(ultima.fim)
  return { inicio: emHora(inicio), fim: emHora(inicio + (duracao > 0 ? duracao : duracaoPadrao)) }
}

/** "09:00 às 12:00", ou nada quando o turno está fechado. */
export function resumoTurno(horarios: Horario[]): string | null {
  if (horarios.length === 0) return null
  const inicios = horarios.map((h) => h.inicio).sort()
  const fins = horarios.map((h) => h.fim).sort()
  return `${inicios[0]} às ${fins.at(-1)}`
}
