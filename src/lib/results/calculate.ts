import { prisma } from '@/lib/db'
import type { InscricaoStatus, Prisma } from '@prisma/client'
import type { CriterioAvaliacao } from '@/lib/avaliacao-criterios'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'
import {
  calculateWithFormula,
  calculateWeightedAverage,
  calculateBlockSum,
  evaluateExpression,
  type NotaAvaliacao,
} from './formula'
import { alocarVagasCategoria } from './alocar-cotas'
import type { CategoriaConfig } from '@/types/categoria-config'

export interface ResultadoInscricao {
  inscricaoId: string
  proponenteNome: string
  categoria: string | null
  cotasOptIn?: string[]
  notaFinal: number
  totalAvaliacoes: number
  empatados?: string[]
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
 * 6. Detecta empates (inscrições com mesma nota final)
 */
export async function calculateResults(
  editalId: string,
): Promise<ResultadoInscricao[]> {
  // Busca critérios do edital
  const edital = await prisma.edital.findUnique({
    where: { id: editalId },
    select: { criteriosAvaliacao: true, formulaAvaliacao: true },
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
        cotasOptIn: inscricao.cotasOptIn,
        notaFinal: 0,
        totalAvaliacoes: 0,
      })
      continue
    }

    // Calcula nota de cada avaliação (fórmula ou média ponderada)
    const allNotas = inscricao.avaliacoes.map((avaliacao) => parseNotas(avaliacao.notas))
    const notasAvaliadores = allNotas.map((notas) =>
      edital.formulaAvaliacao
        ? calculateWithFormula(notas, criterios, edital.formulaAvaliacao)
        : calculateWeightedAverage(notas, criterios),
    )

    // Nota final = média das notas dos avaliadores
    const notaFinal = notasAvaliadores.reduce((sum, n) => sum + n, 0) / notasAvaliadores.length

    resultados.push({
      inscricaoId: inscricao.id,
      proponenteNome: inscricao.proponente.nome,
      categoria: inscricao.categoria,
      cotasOptIn: inscricao.cotasOptIn,
      notaFinal: Math.round(notaFinal * 100) / 100,
      totalAvaliacoes: inscricao.avaliacoes.length,
    })
  }

  // Ordena por nota final descendente
  resultados.sort((a, b) => b.notaFinal - a.notaFinal)

  // Detecta empates: inscrições com mesma notaFinal
  const notaGroups = new Map<number, string[]>()
  for (const r of resultados) {
    const key = r.notaFinal
    if (!notaGroups.has(key)) notaGroups.set(key, [])
    notaGroups.get(key)!.push(r.inscricaoId)
  }

  for (const r of resultados) {
    const group = notaGroups.get(r.notaFinal)!
    if (group.length > 1) {
      r.empatados = group.filter(id => id !== r.inscricaoId)
    }
  }

  return resultados
}

export interface VagasConfig {
  contemplados?: number | null
  suplentes?: number | null
  notaMinima?: number | null
  // Vagas/cotas/valor por categoria. Presente e não-vazio → resultado é
  // calculado e a posição é ranqueada POR CATEGORIA (concorrência
  // concomitante + remanejamento de cotas), ignorando `contemplados`.
  // Ausente/vazio → comportamento legado (ranking único do edital inteiro).
  categoriasConfig?: CategoriaConfig[] | null
}

const CONFIG_SEM_VAGAS_DISCRETAS = (nome: string | null): CategoriaConfig => ({
  nome: nome ?? '—',
  vagasAmplaConcorrencia: null,
  cotas: [],
  valorPorProjeto: null,
  valorTotalCategoria: 0,
})

function decideStatusLegado(r: ResultadoInscricao, index: number, vagas?: VagasConfig): InscricaoStatus {
  const temNota = r.notaFinal > 0 && r.totalAvaliacoes > 0
  if (!temNota) return 'NAO_CONTEMPLADA'
  if (vagas?.notaMinima != null && r.notaFinal < vagas.notaMinima) return 'NAO_CONTEMPLADA'
  if (vagas?.contemplados != null) {
    const posicao = index + 1
    if (posicao <= vagas.contemplados) return 'CONTEMPLADA'
    if (vagas.suplentes != null && posicao <= vagas.contemplados + vagas.suplentes) return 'SUPLENTE'
    if (vagas.suplentes == null) return 'SUPLENTE'
    return 'NAO_CONTEMPLADA'
  }
  return 'CONTEMPLADA'
}

/**
 * Salva as notas finais calculadas nas inscrições.
 *
 * Na fase RESULTADO_FINAL, aplica lógica de ranking:
 * - Com `categoriasConfig`: ranking e corte são calculados POR CATEGORIA,
 *   respeitando ampla concorrência + cotas + remanejamento (ver alocar-cotas.ts).
 *   `posicao` passa a ser a posição dentro da categoria.
 * - Sem `categoriasConfig` (comportamento legado):
 *   - Se vagasContemplados definido: posições 1..N → CONTEMPLADA, N+1..N+M → SUPLENTE, restantes → NAO_CONTEMPLADA
 *   - Se vagasContemplados é null: todos com nota > 0 = CONTEMPLADA
 */
export async function saveResults(
  resultados: ResultadoInscricao[],
  fase: 'RESULTADO_PRELIMINAR' | 'RESULTADO_FINAL',
  vagas?: VagasConfig,
): Promise<void> {
  const categoriasConfig = vagas?.categoriasConfig
  const usaCategorias = categoriasConfig != null && categoriasConfig.length > 0

  if (!usaCategorias) {
    const updates = resultados.map((r, index) =>
      prisma.inscricao.update({
        where: { id: r.inscricaoId },
        data: {
          notaFinal: r.notaFinal,
          posicao: index + 1,
          status: fase === 'RESULTADO_FINAL' ? decideStatusLegado(r, index, vagas) : fase,
        },
      })
    )
    await prisma.$transaction(updates)
    return
  }

  // Agrupa por categoria preservando a ordem recebida (já vem nota-desc de calculateResults)
  const porCategoria = new Map<string | null, ResultadoInscricao[]>()
  for (const r of resultados) {
    if (!porCategoria.has(r.categoria)) porCategoria.set(r.categoria, [])
    porCategoria.get(r.categoria)!.push(r)
  }

  const updates: Prisma.PrismaPromise<unknown>[] = []
  for (const [categoria, grupo] of porCategoria) {
    if (fase !== 'RESULTADO_FINAL') {
      grupo.forEach((r, i) => {
        updates.push(prisma.inscricao.update({
          where: { id: r.inscricaoId },
          data: { notaFinal: r.notaFinal, posicao: i + 1, status: fase },
        }))
      })
      continue
    }

    const config = categoriasConfig.find((c) => c.nome === categoria) ?? CONFIG_SEM_VAGAS_DISCRETAS(categoria)
    const alocacao = alocarVagasCategoria(
      grupo.map((r) => ({
        inscricaoId: r.inscricaoId,
        notaFinal: r.notaFinal,
        totalAvaliacoes: r.totalAvaliacoes,
        cotasOptIn: r.cotasOptIn ?? [],
      })),
      config,
      vagas?.notaMinima,
      vagas?.suplentes,
    )
    grupo.forEach((r, i) => {
      updates.push(prisma.inscricao.update({
        where: { id: r.inscricaoId },
        data: { notaFinal: r.notaFinal, posicao: alocacao[i].posicaoCategoria, status: alocacao[i].status },
      }))
    })
  }

  await prisma.$transaction(updates)
}

/**
 * Salva a ordem manual definida pelo admin para resolver empates.
 */
export async function saveManualOrder(
  editalId: string,
  orderedIds: string[],
): Promise<void> {
  // Busca todas as inscrições do edital ordenadas pela posição atual
  const allInscricoes = await prisma.inscricao.findMany({
    where: { editalId, status: { notIn: ['RASCUNHO', 'ENVIADA'] } },
    select: { id: true, posicao: true, notaFinal: true },
    orderBy: [
      { posicao: { sort: 'asc', nulls: 'last' } },
      { notaFinal: { sort: 'desc', nulls: 'last' } },
    ],
  })

  // Valida que todos os IDs pertencem ao edital
  const allIds = new Set(allInscricoes.map(i => i.id))
  for (const id of orderedIds) {
    if (!allIds.has(id)) {
      throw new Error(`Inscrição ${id} não pertence ao edital ${editalId}`)
    }
  }

  // Pega as posições atuais dos IDs fornecidos para reatribuir na nova ordem
  const reorderedSet = new Set(orderedIds)
  const currentPositions = allInscricoes
    .filter(i => reorderedSet.has(i.id))
    .map(i => i.posicao ?? Infinity)
    .sort((a, b) => a - b)

  // Atualiza os reordenados com as posições que ocupavam (na nova ordem)
  const updates = orderedIds.map((id, i) =>
    prisma.inscricao.update({
      where: { id },
      data: { posicao: currentPositions[i] },
    })
  )

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

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo por fórmula (scoring discreto com soma por bloco)
// ─────────────────────────────────────────────────────────────────────────────

// Re-exportar funções puras de formula.ts para manter compatibilidade
export { calculateWithFormula, calculateWeightedAverage, calculateBlockSum, evaluateExpression } from './formula'
export type { NotaAvaliacao } from './formula'
