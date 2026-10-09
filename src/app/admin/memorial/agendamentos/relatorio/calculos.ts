import type { MemorialStatusAgendamento } from '@prisma/client'
import { diasEntre, somarDias } from '@/lib/memorial/agendamento/datas'
import type { ContagemGrupo } from '@/lib/memorial/agendamento/relatorio'

const formatador = new Intl.NumberFormat('pt-BR')

/** Número com separador de milhar em português: 1.250. */
export function numero(valor: number): string {
  return formatador.format(valor)
}

/** Período imediatamente anterior, com o mesmo número de dias, para comparar justo. */
export function periodoAnterior(de: string, ate: string) {
  const dias = diasEntre(de, ate).length
  return { de: somarDias(de, -dias), ate: somarDias(de, -1), dias }
}

export type Variacao =
  | { tipo: 'nada' }
  | { tipo: 'sem-base' }
  | { tipo: 'igual' }
  | { tipo: 'mais' | 'menos'; percentual: number }

/** Compara o período com o anterior. Sem base (anterior = 0) não existe percentual honesto. */
export function variacao(atual: number, anterior: number): Variacao {
  if (atual === 0 && anterior === 0) return { tipo: 'nada' }
  if (anterior === 0) return { tipo: 'sem-base' }
  if (atual === anterior) return { tipo: 'igual' }
  const percentual = Math.round((Math.abs(atual - anterior) / anterior) * 100)
  return { tipo: atual > anterior ? 'mais' : 'menos', percentual }
}

/** Texto da comparação com o período anterior; null quando os dois períodos estão zerados. */
export function textoVariacao(v: Variacao, anterior: number): string | null {
  switch (v.tipo) {
    case 'nada': return null
    case 'sem-base': return 'Nada no período anterior'
    case 'igual': return `Igual ao período anterior (${numero(anterior)})`
    default: return `${v.percentual}% ${v.tipo === 'mais' ? 'a mais' : 'a menos'} (antes: ${numero(anterior)})`
  }
}

/** Horários em ordem do dia (o relatório entrega por frequência, o gráfico precisa de sequência). */
export function ordenarPorHorario(grupos: ContagemGrupo[]): ContagemGrupo[] {
  return [...grupos].sort((a, b) => a.chave.localeCompare(b.chave))
}

export type GrupoSituacao = 'realizadas' | 'confirmadas' | 'aguardando' | 'faltaram' | 'canceladas' | 'recusadas'

export const ROTULO_SITUACAO: Record<GrupoSituacao, string> = {
  realizadas: 'Realizadas',
  confirmadas: 'Confirmadas',
  aguardando: 'Aguardando resposta',
  faltaram: 'Não compareceram',
  canceladas: 'Canceladas',
  recusadas: 'Recusadas',
}

const GRUPO_DO_STATUS: Record<MemorialStatusAgendamento, GrupoSituacao> = {
  REALIZADO: 'realizadas',
  CONFIRMADO: 'confirmadas',
  SOLICITADO: 'aguardando',
  EM_ANALISE: 'aguardando',
  REAGENDAMENTO_SOLICITADO: 'aguardando',
  NAO_COMPARECEU: 'faltaram',
  CANCELADO: 'canceladas',
  RECUSADO: 'recusadas',
}

const ORDEM: GrupoSituacao[] = ['realizadas', 'confirmadas', 'aguardando', 'faltaram', 'canceladas', 'recusadas']

/** Junta os oito status em seis desfechos que a equipe entende, sem perder nenhum pedido. */
export function agruparSituacao(porStatus: Partial<Record<MemorialStatusAgendamento, number>>) {
  const total: Record<GrupoSituacao, number> = {
    realizadas: 0, confirmadas: 0, aguardando: 0, faltaram: 0, canceladas: 0, recusadas: 0,
  }
  for (const [status, qtd] of Object.entries(porStatus) as [MemorialStatusAgendamento, number][]) {
    total[GRUPO_DO_STATUS[status]] += qtd
  }
  return ORDEM.map((grupo) => ({ grupo, quantidade: total[grupo] }))
}
