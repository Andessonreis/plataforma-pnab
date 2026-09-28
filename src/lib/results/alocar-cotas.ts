import type { CategoriaConfig } from '@/types/categoria-config'

export type StatusAlocacao = 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA'

export interface CandidatoAlocacao {
  inscricaoId: string
  notaFinal: number
  totalAvaliacoes: number
  cotasOptIn: string[]
}

/** Vaga de ampla concorrência; as de cota usam a chave da cota. */
export const VAGA_AMPLA = 'AMPLA'

export interface ResultadoAlocacao {
  inscricaoId: string
  status: StatusAlocacao
  posicaoCategoria: number
  /**
   * Vaga que a contemplada ocupou: `VAGA_AMPLA` ou a chave da cota dona da vaga — também quando a vaga foi
   * remanejada e quem a ocupa não optou por aquela cota. Nula fora das contempladas e sem vagas discretas.
   */
  vaga: string | null
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
 *    Quando a categoria define `destinoVagaDeCotaVazia: 'OUTRAS_COTAS'`, essas vagas
 *    são oferecidas antes aos optantes das demais cotas ainda não alocados.
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
      vaga: null,
    }))
  }

  // Inscrição → vaga ocupada (ver `ResultadoAlocacao.vaga`).
  const alocados = new Map<string, string>()

  // 1. Ampla concorrência
  const vagasAmpla = config.vagasAmplaConcorrencia ?? Infinity
  for (const c of candidatos) {
    if (alocados.size >= vagasAmpla) break
    if (!elegivel(c)) continue
    alocados.set(c.inscricaoId, VAGA_AMPLA)
  }

  // 2. Cotas — por ordem de nota, entre optantes ainda não alocados
  const vagasSobrando: string[] = []
  for (const cota of config.cotas) {
    let vagas = cota.vagas
    for (const c of candidatos) {
      if (vagas <= 0) break
      if (alocados.has(c.inscricaoId)) continue
      if (!elegivel(c)) continue
      if (!c.cotasOptIn.includes(cota.key)) continue
      alocados.set(c.inscricaoId, cota.key)
      vagas--
    }
    for (; vagas > 0; vagas--) vagasSobrando.push(cota.key)
  }

  // 3. Remanejamento — vagas de cota não preenchidas voltam pra ampla concorrência
  // (ou, conforme o edital, passam antes pelos optantes das outras cotas)
  const chavesDeCota = new Set(config.cotas.map((cota) => cota.key))
  const optaPorAlgumaCota = (c: CandidatoAlocacao): boolean => c.cotasOptIn.some((key) => chavesDeCota.has(key))

  const remanejar = (vagas: string[], podeReceber: (c: CandidatoAlocacao) => boolean): string[] => {
    const restantes = [...vagas]
    for (const c of candidatos) {
      if (restantes.length === 0) break
      if (alocados.has(c.inscricaoId)) continue
      if (!elegivel(c)) continue
      if (!podeReceber(c)) continue
      alocados.set(c.inscricaoId, restantes.shift()!)
    }
    return restantes
  }

  let vagasRemanejadas = vagasSobrando
  if (config.destinoVagaDeCotaVazia === 'OUTRAS_COTAS') {
    vagasRemanejadas = remanejar(vagasRemanejadas, optaPorAlgumaCota)
  }
  remanejar(vagasRemanejadas, () => true)

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
    return { inscricaoId: c.inscricaoId, status, posicaoCategoria: i + 1, vaga: alocados.get(c.inscricaoId) ?? null }
  })
}
