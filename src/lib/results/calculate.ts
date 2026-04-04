import { prisma } from '@/lib/db'
import type { InscricaoStatus } from '@prisma/client'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'

interface NotaAvaliacao {
  criterio: string
  nota: number
  peso?: number
}

interface RegraDesempate {
  descricao: string
  tipo: 'bloco' | 'criterio'
  ref: string
  direcao: 'desc' | 'asc'
}

interface ResultadoInscricao {
  inscricaoId: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number
  totalAvaliacoes: number
  scoresBlocos?: Record<string, number>
}

/**
 * Calcula a nota final de todas as inscrições habilitadas de um edital.
 *
 * Algoritmo:
 * 1. Busca todas as inscrições com status HABILITADA ou EM_AVALIACAO
 * 2. Para cada inscrição, busca as avaliações finalizadas
 * 3. Para cada avaliação, calcula a média ponderada das notas
 * 4. A nota final da inscrição é a média das notas dos avaliadores
 * 5. Ordena por nota final descendente
 */
export async function calculateResults(
  editalId: string,
  desempateRules?: RegraDesempate[] | null,
): Promise<ResultadoInscricao[]> {
  // Busca critérios do edital
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { criteriosAvaliacao: true },
  })

  if (!edital) throw new Error(`Edital ${editalId} não encontrado`)

  const criterios = parseCriterios(edital.criteriosAvaliacao)

  // Identificar blocos únicos se temos regras de desempate
  const blocosDesempate = desempateRules?.filter(r => r.tipo === 'bloco').map(r => r.ref) ?? []
  const criteriosDesempate = desempateRules?.filter(r => r.tipo === 'criterio').map(r => r.ref) ?? []

  // Busca inscrições avaliadas
  const inscricoes = await prisma.inscricao.findMany({
    where: {
      editalId,
      status: { in: ['HABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO'] },
    },
    include: {
      proponente: { select: { nome: true } },
      avaliacoes: {
        where: { finalizada: true },
        select: { notas: true, notaTotal: true },
      },
    },
  })

  const resultados: ResultadoInscricao[] = []

  for (const inscricao of inscricoes) {
    if (inscricao.avaliacoes.length === 0) {
      // Sem avaliações finalizadas — nota 0
      resultados.push({
        inscricaoId: inscricao.id,
        proponenteNome: inscricao.proponente.nome,
        categoria: inscricao.categoria,
        notaFinal: 0,
        totalAvaliacoes: 0,
      })
      continue
    }

    // Calcula média ponderada de cada avaliação
    const allNotas = inscricao.avaliacoes.map((avaliacao) => parseNotas(avaliacao.notas))
    const notasAvaliadores = allNotas.map((notas) => calculateWeightedAverage(notas, criterios))

    // Nota final = média das notas dos avaliadores
    const notaFinal = notasAvaliadores.reduce((sum, n) => sum + n, 0) / notasAvaliadores.length

    // Calcula scores de blocos/critérios para desempate (se necessário)
    let scoresBlocos: Record<string, number> | undefined
    if (desempateRules && desempateRules.length > 0) {
      scoresBlocos = {}
      for (const blocoRef of blocosDesempate) {
        const scores = allNotas.map(notas => calculateBlockScore(notas, criterios, blocoRef))
        scoresBlocos[blocoRef] = scores.reduce((s, n) => s + n, 0) / scores.length
      }
      for (const critRef of criteriosDesempate) {
        const scores = allNotas.map(notas => calculateCriterioScore(notas, criterios, critRef))
        scoresBlocos[critRef] = scores.reduce((s, n) => s + n, 0) / scores.length
      }
    }

    resultados.push({
      inscricaoId: inscricao.id,
      proponenteNome: inscricao.proponente.nome,
      categoria: inscricao.categoria,
      notaFinal: Math.round(notaFinal * 100) / 100,
      totalAvaliacoes: inscricao.avaliacoes.length,
      scoresBlocos,
    })
  }

  // Ordena por nota final (descendente) + desempate multi-nível
  resultados.sort((a, b) => {
    const diff = b.notaFinal - a.notaFinal
    if (diff !== 0) return diff

    if (desempateRules && desempateRules.length > 0) {
      for (const rule of desempateRules) {
        const scoreA = a.scoresBlocos?.[rule.ref] ?? 0
        const scoreB = b.scoresBlocos?.[rule.ref] ?? 0
        const d = rule.direcao === 'desc' ? scoreB - scoreA : scoreA - scoreB
        if (Math.abs(d) > 0.001) return d
      }
    }

    return 0
  })

  return resultados
}

export interface VagasConfig {
  contemplados?: number | null
  suplentes?: number | null
  notaMinima?: number | null
}

/**
 * Salva as notas finais calculadas nas inscrições.
 *
 * Na fase RESULTADO_FINAL, aplica lógica de ranking:
 * - Se vagasContemplados definido: posições 1..N → CONTEMPLADA, N+1..N+M → SUPLENTE, restantes → NAO_CONTEMPLADA
 * - Se vagasContemplados é null: comportamento anterior (todos com nota > 0 = CONTEMPLADA)
 */
export async function saveResults(
  resultados: ResultadoInscricao[],
  fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL',
  vagas?: VagasConfig,
): Promise<void> {
  const updates = resultados.map((r, index) => {
    let status: InscricaoStatus = fase

    if (fase === 'RESULTADO_FINAL') {
      const temNota = r.notaFinal > 0 && r.totalAvaliacoes > 0

      if (!temNota) {
        status = 'NAO_CONTEMPLADA'
      } else if (vagas?.notaMinima != null && r.notaFinal < vagas.notaMinima) {
        // Abaixo da nota mínima para classificação
        status = 'NAO_CONTEMPLADA'
      } else if (vagas?.contemplados != null) {
        // Ranking com vagas definidas (resultados já vêm ordenados por nota desc)
        const posicao = index + 1
        if (posicao <= vagas.contemplados) {
          status = 'CONTEMPLADA'
        } else if (vagas.suplentes != null && posicao <= vagas.contemplados + vagas.suplentes) {
          status = 'SUPLENTE'
        } else if (vagas.suplentes == null) {
          // Sem limite de suplentes: todos restantes com nota são suplentes
          status = 'SUPLENTE'
        } else {
          status = 'NAO_CONTEMPLADA'
        }
      } else {
        // Sem vagas definidas: comportamento anterior
        status = 'CONTEMPLADA'
      }
    }

    return prisma.inscricao.update({
      where: { id: r.inscricaoId },
      data: {
        notaFinal: r.notaFinal,
        status,
      },
    })
  })

  await prisma.$transaction(updates)
}

export function parseCriterios(raw: unknown): CriterioAvaliacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [...CRITERIOS_AVALIACAO_PADRAO] }
  }
  if (!Array.isArray(data) || data.length === 0) return [...CRITERIOS_AVALIACAO_PADRAO]
  return data as CriterioAvaliacao[]
}

export function parseNotas(raw: unknown): NotaAvaliacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []
  return data as NotaAvaliacao[]
}

export function calculateBlockScore(
  notas: NotaAvaliacao[],
  criterios: CriterioAvaliacao[],
  blocoRef: string,
): number {
  const critDoBloco = criterios.filter(c => c.bloco === blocoRef)
  if (critDoBloco.length === 0) return 0
  const notasDoBloco = notas.filter(n => critDoBloco.some(c => c.criterio === n.criterio))
  return calculateWeightedAverage(notasDoBloco, critDoBloco)
}

export function calculateCriterioScore(
  notas: NotaAvaliacao[],
  criterios: CriterioAvaliacao[],
  criterioRef: string,
): number {
  const criterio = criterios.find(c => c.criterio === criterioRef)
  if (!criterio) return 0
  const nota = notas.find(n => n.criterio === criterioRef)
  if (!nota) return 0
  return calculateWeightedAverage([nota], [criterio])
}

export function calculateWeightedAverage(notas: NotaAvaliacao[], criterios: CriterioAvaliacao[]): number {
  let totalPeso = 0
  let totalPonderado = 0

  for (const nota of notas) {
    const criterio = criterios.find((c) => c.criterio === nota.criterio)
    const peso = nota.peso ?? criterio?.peso ?? 1
    const notaMax = criterio?.notaMax ?? 10

    // Normaliza a nota para 0-10 se notaMax for diferente
    const normalizada = notaMax > 0 ? (nota.nota / notaMax) * 10 : 0

    totalPonderado += normalizada * peso
    totalPeso += peso
  }

  if (totalPeso === 0) return 0
  return totalPonderado / totalPeso
}
