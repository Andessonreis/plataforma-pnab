import { prisma } from '@/lib/db'
import type { InscricaoStatus } from '@prisma/client'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'

interface NotaAvaliacao {
  criterio: string
  nota: number
  peso?: number
}

interface ResultadoInscricao {
  inscricaoId: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number
  totalAvaliacoes: number
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
export async function calculateResults(editalId: string): Promise<ResultadoInscricao[]> {
  // Busca critérios do edital
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { criteriosAvaliacao: true },
  })

  if (!edital) throw new Error(`Edital ${editalId} não encontrado`)

  const criterios = parseCriterios(edital.criteriosAvaliacao)

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
    const notasAvaliadores = inscricao.avaliacoes.map((avaliacao) => {
      const notas = parseNotas(avaliacao.notas)
      return calculateWeightedAverage(notas, criterios)
    })

    // Nota final = média das notas dos avaliadores
    const notaFinal = notasAvaliadores.reduce((sum, n) => sum + n, 0) / notasAvaliadores.length

    resultados.push({
      inscricaoId: inscricao.id,
      proponenteNome: inscricao.proponente.nome,
      categoria: inscricao.categoria,
      notaFinal: Math.round(notaFinal * 100) / 100,
      totalAvaliacoes: inscricao.avaliacoes.length,
    })
  }

  // Ordena por nota final (descendente)
  resultados.sort((a, b) => b.notaFinal - a.notaFinal)

  return resultados
}

export interface VagasConfig {
  contemplados?: number | null
  suplentes?: number | null
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

function parseCriterios(raw: unknown): CriterioAvaliacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [...CRITERIOS_AVALIACAO_PADRAO] }
  }
  if (!Array.isArray(data) || data.length === 0) return [...CRITERIOS_AVALIACAO_PADRAO]
  return data as CriterioAvaliacao[]
}

function parseNotas(raw: unknown): NotaAvaliacao[] {
  let data = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []
  return data as NotaAvaliacao[]
}

function calculateWeightedAverage(notas: NotaAvaliacao[], criterios: CriterioAvaliacao[]): number {
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
