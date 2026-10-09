import { diaDaSemana, intervaloDoMes, somarDias } from '@/lib/memorial/agendamento/datas'

export type Escala = 'mes' | 'semana' | 'dia'

/** Intervalo que a tela mostra para um dia de referência. Semana vai de domingo a sábado. */
export function periodoDaEscala(escala: Escala, ref: string): { de: string; ate: string } {
  if (escala === 'dia') return { de: ref, ate: ref }
  if (escala === 'semana') {
    const de = somarDias(ref, -diaDaSemana(ref))
    return { de, ate: somarDias(de, 6) }
  }
  return intervaloDoMes(ref.slice(0, 7))
}

/** Dia de referência da tela anterior (-1) ou seguinte (+1). */
export function deslocar(escala: Escala, ref: string, sentido: 1 | -1): string {
  if (escala === 'dia') return somarDias(ref, sentido)
  if (escala === 'semana') return somarDias(ref, 7 * sentido)
  const d = new Date(`${ref.slice(0, 7)}-01T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + sentido)
  return d.toISOString().slice(0, 10)
}

const fmt = (opcoes: Intl.DateTimeFormatOptions, dia: string) =>
  new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`))

export function tituloDoPeriodo(escala: Escala, ref: string): string {
  const { de, ate } = periodoDaEscala(escala, ref)
  if (escala === 'mes') return fmt({ month: 'long', year: 'numeric' }, de)
  if (escala === 'dia') return fmt({ weekday: 'long', day: 'numeric', month: 'long' }, de)
  return `${fmt({ day: 'numeric', month: 'short' }, de)} a ${fmt({ day: 'numeric', month: 'short', year: 'numeric' }, ate)}`
}
