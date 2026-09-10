// Critérios padrão PNAB — utilizados quando o edital não configura critérios específicos
export const CRITERIOS_AVALIACAO_PADRAO = [
  {
    criterio: 'Relevância Cultural',
    peso: 25,
    descricao: 'Impacto e relevância do projeto para a cultura local e regional',
    notaMax: 10,
  },
  {
    criterio: 'Viabilidade Técnica',
    peso: 25,
    descricao: 'Capacidade técnica de execução e adequação dos recursos solicitados',
    notaMax: 10,
  },
  {
    criterio: 'Coerência do Plano de Trabalho',
    peso: 20,
    descricao: 'Clareza, consistência e detalhamento das ações propostas',
    notaMax: 10,
  },
  {
    criterio: 'Contrapartida Social',
    peso: 15,
    descricao: 'Benefício gerado para a comunidade e acessibilidade do projeto',
    notaMax: 10,
  },
  {
    criterio: 'Histórico do Proponente',
    peso: 15,
    descricao: 'Experiência comprovada e trajetória artístico-cultural',
    notaMax: 10,
  },
] as const

export type CriterioAvaliacao = {
  criterio: string
  peso: number
  descricao?: string
  notaMax: number
  bloco?: string
  // Scoring discreto (3 níveis): Não Atende / Parcial / Plenamente
  modo?: 'slider' | 'discreto'
  naoAtende?: number
  parcial?: number
  plenamente?: number
}

/** Critérios configurados no edital (campo Json) ou, se ausentes/vazios, os padrão. */
export function parseCriterios(raw: unknown): CriterioAvaliacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [...CRITERIOS_AVALIACAO_PADRAO] }
  }
  if (!Array.isArray(data) || data.length === 0) return [...CRITERIOS_AVALIACAO_PADRAO]
  return data as CriterioAvaliacao[]
}

export type NotaSubmetida = { criterio: string; nota: number }

/**
 * O teto de nota é por critério (`notaMax`), não global — editais como o Festival
 * do Centenário usam critérios de 0 a 30. Só dá pra validar depois de carregar o
 * edital, então não cabe no schema Zod.
 *
 * Retorna a mensagem de erro, ou null quando todas as notas são válidas.
 */
export function validarNotasContraCriterios(
  notas: NotaSubmetida[],
  criterios: CriterioAvaliacao[],
): string | null {
  for (const nota of notas) {
    const criterio = criterios.find((c) => c.criterio === nota.criterio)

    if (!criterio) {
      return `Critério "${nota.criterio}" não pertence aos critérios de avaliação deste edital.`
    }

    const notaMax = typeof criterio.notaMax === 'number' ? criterio.notaMax : 10
    if (nota.nota > notaMax) {
      return `Nota ${nota.nota} excede o máximo de ${notaMax} do critério "${criterio.criterio}".`
    }
  }

  return null
}
