import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'

/** Linha mínima que o relatório precisa — sem nenhum dado pessoal do responsável. */
export interface LinhaRelatorio {
  status: MemorialStatusAgendamento
  tipoVisitante: string
  faixaEtaria: string | null
  quantidade: number
  turno: MemorialTurno
  horaInicio: string
}

export interface ContagemGrupo {
  chave: string
  visitas: number
  visitantes: number
}

export interface RelatorioVisitas {
  pedidos: number
  porStatus: Partial<Record<MemorialStatusAgendamento, number>>
  /** Confirmadas e realizadas: o que de fato entrou (ou vai entrar) na agenda. */
  visitas: number
  visitantes: number
  realizadas: number
  visitantesRealizados: number
  cancelamentos: number
  recusas: number
  /** Realizadas ÷ (realizadas + faltas). null enquanto nenhuma visita foi encerrada. */
  taxaComparecimento: number | null
  porTipoVisitante: ContagemGrupo[]
  porFaixaEtaria: ContagemGrupo[]
  porHorario: ContagemGrupo[]
}

const NA_AGENDA: MemorialStatusAgendamento[] = ['CONFIRMADO', 'REALIZADO']

function agrupar(linhas: LinhaRelatorio[], chave: (l: LinhaRelatorio) => string): ContagemGrupo[] {
  const mapa = new Map<string, ContagemGrupo>()
  for (const linha of linhas) {
    const k = chave(linha)
    const atual = mapa.get(k) ?? { chave: k, visitas: 0, visitantes: 0 }
    atual.visitas += 1
    atual.visitantes += linha.quantidade
    mapa.set(k, atual)
  }
  return [...mapa.values()].sort((a, b) => b.visitas - a.visitas || a.chave.localeCompare(b.chave))
}

export function montarRelatorio(linhas: LinhaRelatorio[]): RelatorioVisitas {
  const porStatus: RelatorioVisitas['porStatus'] = {}
  for (const l of linhas) porStatus[l.status] = (porStatus[l.status] ?? 0) + 1

  const naAgenda = linhas.filter((l) => NA_AGENDA.includes(l.status))
  const realizadas = linhas.filter((l) => l.status === 'REALIZADO')
  const faltas = porStatus.NAO_COMPARECEU ?? 0
  const encerradas = realizadas.length + faltas

  return {
    pedidos: linhas.length,
    porStatus,
    visitas: naAgenda.length,
    visitantes: naAgenda.reduce((s, l) => s + l.quantidade, 0),
    realizadas: realizadas.length,
    visitantesRealizados: realizadas.reduce((s, l) => s + l.quantidade, 0),
    cancelamentos: porStatus.CANCELADO ?? 0,
    recusas: porStatus.RECUSADO ?? 0,
    taxaComparecimento: encerradas === 0 ? null : realizadas.length / encerradas,
    porTipoVisitante: agrupar(naAgenda, (l) => l.tipoVisitante),
    porFaixaEtaria: agrupar(naAgenda, (l) => l.faixaEtaria?.trim() || 'Não informada'),
    porHorario: agrupar(naAgenda, (l) => l.horaInicio),
  }
}
