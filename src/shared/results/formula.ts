/**
 * Funções puras de cálculo de notas — sem dependência de Prisma.
 * Podem ser importadas tanto no servidor quanto em componentes client.
 */

import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'

export interface NotaAvaliacao {
  criterio: string
  nota: number
  peso?: number
}

// ─── Soma bruta por bloco ───────────────────────────────────────────────────

/**
 * Calcula a soma bruta das notas de um bloco específico.
 * Usado com scoring discreto (Não Atende / Parcial / Plenamente).
 */
export function calculateBlockSum(
  notas: NotaAvaliacao[],
  criterios: CriterioAvaliacao[],
  bloco: string,
): number {
  const criteriosDoBloco = criterios.filter((c) => c.bloco === bloco)
  let soma = 0
  for (const criterio of criteriosDoBloco) {
    const nota = notas.find((n) => n.criterio === criterio.criterio)
    if (nota) soma += nota.nota
  }
  return soma
}

// ─── Parser de expressão matemática ─────────────────────────────────────────

/**
 * Avalia uma expressão matemática simples com variáveis (B1, B2, B3...).
 * Suporta: +, -, *, /, () e números decimais.
 * NÃO usa eval() — parser seguro com recursive descent.
 */
export function evaluateExpression(expr: string, variables: Record<string, number>): number {
  let normalized = expr.replace(/\s+/g, '')
  const keys = Object.keys(variables).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    normalized = normalized.split(key).join(String(variables[key]))
  }

  let pos = 0

  function parseExpr(): number {
    let result = parseTerm()
    while (pos < normalized.length && (normalized[pos] === '+' || normalized[pos] === '-')) {
      const op = normalized[pos++]
      const term = parseTerm()
      result = op === '+' ? result + term : result - term
    }
    return result
  }

  function parseTerm(): number {
    let result = parseFactor()
    while (pos < normalized.length && (normalized[pos] === '*' || normalized[pos] === '/')) {
      const op = normalized[pos++]
      const factor = parseFactor()
      result = op === '*' ? result * factor : (factor !== 0 ? result / factor : 0)
    }
    return result
  }

  function parseFactor(): number {
    if (normalized[pos] === '(') {
      pos++
      const result = parseExpr()
      pos++
      return result
    }
    const start = pos
    if (normalized[pos] === '-') pos++
    while (pos < normalized.length && (normalized[pos] >= '0' && normalized[pos] <= '9' || normalized[pos] === '.')) {
      pos++
    }
    return parseFloat(normalized.slice(start, pos)) || 0
  }

  return parseExpr()
}

// ─── Cálculo com fórmula customizada ────────────────────────────────────────

/**
 * Calcula a nota usando fórmula com blocos.
 * Ex: "((B1+B2)/2)+B3" → soma Bloco 1 + soma Bloco 2 dividido por 2, + Bloco 3.
 */
export function calculateWithFormula(
  notas: NotaAvaliacao[],
  criterios: CriterioAvaliacao[],
  formula: string,
): number {
  const blocos = [...new Set(criterios.map((c) => c.bloco).filter(Boolean))] as string[]
  blocos.sort()

  const variables: Record<string, number> = {}
  for (let i = 0; i < blocos.length; i++) {
    const key = `B${i + 1}`
    variables[key] = calculateBlockSum(notas, criterios, blocos[i])
  }

  return Math.round(evaluateExpression(formula, variables) * 100) / 100
}

// ─── Média ponderada normalizada (modo padrão) ─────────────────────────────

export function calculateWeightedAverage(notas: NotaAvaliacao[], criterios: CriterioAvaliacao[]): number {
  let totalPeso = 0
  let totalPonderado = 0

  for (const nota of notas) {
    const criterio = criterios.find((c) => c.criterio === nota.criterio)
    const peso = nota.peso ?? criterio?.peso ?? 1
    const notaMax = criterio?.notaMax ?? 10

    const normalizada = notaMax > 0 ? (nota.nota / notaMax) * 10 : 0

    totalPonderado += normalizada * peso
    totalPeso += peso
  }

  if (totalPeso === 0) return 0
  return totalPonderado / totalPeso
}

/**
 * Calcula a nota total usando fórmula ou média ponderada.
 * Função de conveniência que decide qual método usar.
 */
export function calculateTotal(
  notas: NotaAvaliacao[],
  criterios: CriterioAvaliacao[],
  formulaAvaliacao?: string | null,
): number {
  if (formulaAvaliacao) {
    return calculateWithFormula(notas, criterios, formulaAvaliacao)
  }
  return calculateWeightedAverage(notas, criterios)
}
