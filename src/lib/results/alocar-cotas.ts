import type { CategoriaConfig } from '@/types/categoria-config'

export type StatusAlocacao = 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA'

export interface CandidatoAlocacao {
  inscricaoId: string
  notaFinal: number
  totalAvaliacoes: number
  cotasOptIn: string[]
}

export interface ResultadoAlocacao {
  inscricaoId: string
  status: StatusAlocacao
  posicaoCategoria: number
}

/**
 * Aloca vagas de uma categoria entre os candidatos (já ordenados por notaFinal
 * descendente), respeitando concorrência concomitante e remanejamento de cotas
 * (itens 5.2–5.4 do edital de referência):
 *
 * 1. Ampla concorrência é preenchida pelos mais bem colocados, cotista ou não.
 * 2. Cada cota é preenchida, entre quem optou por ela e ainda não foi alocado,
 *    por ordem de nota.
 * 3. Vagas de cota não preenchidas (falta de optantes aptos) voltam pro pool de
 *    ampla concorrência, preenchidas pelos próximos melhor colocados não alocados.
 * 4. Suplentes: próximos colocados não alocados, até `maxSuplentes` (null = sem teto).
 *
 * Categoria sem vagas discretas configuradas (`vagasAmplaConcorrencia === null`
 * e nenhuma cota com vagas > 0) mantém o comportamento legado: nota > 0 vira
 * CONTEMPLADA, sem corte por posição.
 */
export function alocarVagasCategoria(
  candidatos: CandidatoAlocacao[],
  config: CategoriaConfig,
  notaMinima?: number | null,
  maxSuplentes?: number | null,
): ResultadoAlocacao[] {
  const temVagasDiscretas = config.vagasAmplaConcorrencia !== null || config.cotas.some((c) => c.vagas > 0)

  const elegivel = (c: CandidatoAlocacao): boolean => {
    const temNota = c.notaFinal > 0 && c.totalAvaliacoes > 0
    if (!temNota) return false
    if (notaMinima != null && c.notaFinal < notaMinima) return false
    return true
  }

  if (!temVagasDiscretas) {
    return candidatos.map((c, i) => ({
      inscricaoId: c.inscricaoId,
      status: elegivel(c) ? 'CONTEMPLADA' : 'NAO_CONTEMPLADA',
      posicaoCategoria: i + 1,
    }))
  }

  const alocados = new Set<string>()

  // 1. Ampla concorrência
  const vagasAmpla = config.vagasAmplaConcorrencia ?? Infinity
  for (const c of candidatos) {
    if (alocados.size >= vagasAmpla) break
    if (!elegivel(c)) continue
    alocados.add(c.inscricaoId)
  }

  // 2. Cotas — por ordem de nota, entre optantes ainda não alocados
  const vagasRestantesPorCota = new Map(config.cotas.map((cota) => [cota.key, cota.vagas]))
  for (const cota of config.cotas) {
    let vagas = vagasRestantesPorCota.get(cota.key) ?? 0
    for (const c of candidatos) {
      if (vagas <= 0) break
      if (alocados.has(c.inscricaoId)) continue
      if (!elegivel(c)) continue
      if (!c.cotasOptIn.includes(cota.key)) continue
      alocados.add(c.inscricaoId)
      vagas--
    }
    vagasRestantesPorCota.set(cota.key, vagas)
  }

  // 3. Remanejamento — vagas de cota não preenchidas voltam pra ampla concorrência
  let vagasRemanejadas = 0
  for (const restante of vagasRestantesPorCota.values()) {
    vagasRemanejadas += Math.max(0, restante)
  }
  for (const c of candidatos) {
    if (vagasRemanejadas <= 0) break
    if (alocados.has(c.inscricaoId)) continue
    if (!elegivel(c)) continue
    alocados.add(c.inscricaoId)
    vagasRemanejadas--
  }

  // 4. Suplentes — próximos colocados não alocados, até o teto (null = sem teto)
  const suplentes = new Set<string>()
  for (const c of candidatos) {
    if (alocados.has(c.inscricaoId)) continue
    if (!elegivel(c)) continue
    if (maxSuplentes != null && suplentes.size >= maxSuplentes) break
    suplentes.add(c.inscricaoId)
  }

  return candidatos.map((c, i) => {
    let status: StatusAlocacao = 'NAO_CONTEMPLADA'
    if (alocados.has(c.inscricaoId)) status = 'CONTEMPLADA'
    else if (suplentes.has(c.inscricaoId)) status = 'SUPLENTE'
    return { inscricaoId: c.inscricaoId, status, posicaoCategoria: i + 1 }
  })
}
