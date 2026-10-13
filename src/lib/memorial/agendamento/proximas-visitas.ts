import type { MemorialStatusAgendamento } from '@prisma/client'
import { dateParaDia, inicioDaVisita } from './datas'
import { STATUS_ATIVOS } from './status'

/** O mínimo de uma visita para decidir se ela ainda vai acontecer. */
export interface VisitaNoTempo {
  data: Date
  horaInicio: string
  horaFim: string
  status: MemorialStatusAgendamento
  protocolo: string
}

export type ProximaVisita<T> = T & { emAndamento: boolean }

interface Instantes {
  inicio: number
  fim: number
}

function instantes(v: VisitaNoTempo): Instantes {
  const dia = dateParaDia(v.data)
  return { inicio: inicioDaVisita(dia, v.horaInicio).getTime(), fim: inicioDaVisita(dia, v.horaFim).getTime() }
}

/**
 * Separa as visitas que ainda vão acontecer da última que já passou.
 *
 * "Próxima" é o pedido ativo cujo horário ainda não terminou no relógio de
 * Irecê: a visita em andamento continua na lista até o fim do horário. Vêm da
 * mais próxima para a mais distante; no mesmo início, a que termina antes vem
 * primeiro e o protocolo desempata, para a ordem não mudar entre recargas.
 *
 * `ultima` é a mais recente entre as que já começaram, em qualquer situação,
 * para o painel ter o que mostrar quando não há nada por vir. Pedido futuro
 * recusado ou cancelado não conta: não é visita que aconteceu.
 */
export function separarVisitas<T extends VisitaNoTempo>(
  visitas: T[],
  agora: Date,
): { proximas: ProximaVisita<T>[]; ultima: T | null } {
  const momento = agora.getTime()
  const comInstantes = visitas.map((v) => ({ v, ...instantes(v) }))

  const ehProxima = (x: { v: T; fim: number }) => STATUS_ATIVOS.includes(x.v.status) && x.fim > momento

  const proximas = comInstantes
    .filter(ehProxima)
    .sort((a, b) => a.inicio - b.inicio || a.fim - b.fim || a.v.protocolo.localeCompare(b.v.protocolo))
    .map(({ v, inicio }) => ({ ...v, emAndamento: inicio <= momento }))

  const ultima =
    comInstantes
      .filter((x) => !ehProxima(x) && x.inicio <= momento)
      .sort((a, b) => b.inicio - a.inicio || b.v.protocolo.localeCompare(a.v.protocolo))[0]?.v ?? null

  return { proximas, ultima }
}
