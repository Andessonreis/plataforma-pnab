import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import type { EditalStatus } from '@prisma/client'
import {
  TRANSICOES_AUTOMATICAS,
  STATUS_ELEGIVEIS_SCHEDULER,
} from '@/types/cronograma'

export interface SchedulerJobData {
  trigger: 'cron'
}

// ── Tipos internos ──────────────────────────────────────────────────────────

interface CronogramaRawItem {
  tipo?: 'fase' | 'custom'
  fase?: string
  label?: string
  dataHora: string
  destaque?: boolean
}

// ── Funções utilitárias (exportadas para testes) ────────────────────────────

/**
 * Normaliza texto para matching fuzzy de labels do cronograma.
 * Remove acentos, converte para minúsculas e remove espaços extras.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Verifica se o label do cronograma corresponde a uma fase esperada.
 */
export function matchLabel(label: string, patterns: string[]): boolean {
  const normalized = normalize(label)
  return patterns.some((p) => normalized.includes(p))
}

// Padrões de labels para backward compat (formato legado)
export const INICIO_INSCRICOES_PATTERNS = [
  'inicio das inscricoes',
  'inicio inscricoes',
  'abertura das inscricoes',
  'abertura inscricoes',
  'inscricoes abertas',
]

export const ENCERRAMENTO_INSCRICOES_PATTERNS = [
  'encerramento das inscricoes',
  'encerramento inscricoes',
  'fim das inscricoes',
  'fim inscricoes',
  'inscricoes encerradas',
]

const HABILITACAO_PATTERNS = [
  'inicio da habilitacao',
  'inicio habilitacao',
  'habilitacao',
  'fase de habilitacao',
]

const AVALIACAO_PATTERNS = [
  'inicio da avaliacao',
  'inicio avaliacao',
  'avaliacao',
  'fase de avaliacao',
]

const RECURSO_PATTERNS = [
  'inicio da fase de recursos',
  'fase de recursos',
  'recursos',
  'inicio recursos',
]

const ENCERRADO_PATTERNS = [
  'encerramento do edital',
  'encerramento edital',
  'encerramento',
]

/**
 * Mapa legado: status atual → (patterns do label, novo status)
 */
const LEGACY_TRANSITIONS: Array<{
  statusAtual: EditalStatus
  patterns: string[]
  novoStatus: EditalStatus
}> = [
  { statusAtual: 'PUBLICADO', patterns: INICIO_INSCRICOES_PATTERNS, novoStatus: 'INSCRICOES_ABERTAS' },
  { statusAtual: 'INSCRICOES_ABERTAS', patterns: ENCERRAMENTO_INSCRICOES_PATTERNS, novoStatus: 'INSCRICOES_ENCERRADAS' },
  { statusAtual: 'INSCRICOES_ENCERRADAS', patterns: HABILITACAO_PATTERNS, novoStatus: 'HABILITACAO' },
  { statusAtual: 'HABILITACAO', patterns: AVALIACAO_PATTERNS, novoStatus: 'AVALIACAO' },
  { statusAtual: 'RESULTADO_PRELIMINAR', patterns: RECURSO_PATTERNS, novoStatus: 'RECURSO' },
  { statusAtual: 'RESULTADO_FINAL', patterns: ENCERRADO_PATTERNS, novoStatus: 'ENCERRADO' },
]

// ── Extração de itens do cronograma ─────────────────────────────────────────

/**
 * Extrai items de fase do cronograma, suportando formato novo e legado.
 * Retorna array de { fase, dataHora } para o status atual do edital.
 */
export function extractFaseItems(
  cronograma: CronogramaRawItem[],
  statusAtual: EditalStatus,
): { fase: EditalStatus; dataHora: string } | null {
  // 1. Formato novo: busca item com tipo='fase' cuja transição AUTOMÁTICA corresponde ao status atual
  for (const item of cronograma) {
    if (item.tipo === 'fase' && item.fase) {
      const transicao = TRANSICOES_AUTOMATICAS[item.fase as EditalStatus]
      if (transicao && transicao.de === statusAtual && item.dataHora) {
        return { fase: item.fase as EditalStatus, dataHora: item.dataHora }
      }
    }
  }

  // 2. Fallback legado: items sem campo `tipo`, usa fuzzy matching
  const legacyTransition = LEGACY_TRANSITIONS.find((t) => t.statusAtual === statusAtual)
  if (legacyTransition) {
    for (const item of cronograma) {
      if (!item.tipo && item.label && matchLabel(item.label, legacyTransition.patterns)) {
        if (item.dataHora) {
          return { fase: legacyTransition.novoStatus, dataHora: item.dataHora }
        }
      }
    }
  }

  return null
}

// ── Lógica principal ────────────────────────────────────────────────────────

/**
 * Lógica principal do scheduler — extraída para testabilidade.
 */
export async function processSchedulerJob(): Promise<number> {
  const now = new Date()

  // Busca editais que podem ter transição automática (6 status elegíveis)
  const editais = await prisma.edital.findMany({
    where: {
      status: { in: STATUS_ELEGIVEIS_SCHEDULER as EditalStatus[] },
    },
    select: {
      id: true,
      titulo: true,
      status: true,
      cronograma: true,
    },
  })

  let transicoes = 0

  for (const edital of editais) {
    const cronograma = (edital.cronograma as unknown as CronogramaRawItem[]) || []

    const match = extractFaseItems(cronograma, edital.status)
    if (!match || new Date(match.dataHora) > now) {
      continue
    }

    await prisma.edital.update({
      where: { id: edital.id },
      data: { status: match.fase },
    })

    await logAudit({
      action: AUDIT_ACTIONS.STATUS_ALTERADO,
      entity: 'Edital',
      entityId: edital.id,
      details: {
        titulo: edital.titulo,
        statusAnterior: edital.status,
        novoStatus: match.fase,
        automatico: true,
      },
    })

    console.log(`[Scheduler] Edital "${edital.titulo}": ${edital.status} → ${match.fase}`)
    transicoes++
  }

  console.log(`[Scheduler] Concluído — ${transicoes} transição(ões) realizada(s)`)
  return transicoes
}

export const schedulerWorker = new Worker<SchedulerJobData>(
  'scheduler',
  async (job) => {
    console.log(`[Scheduler] Verificando transições de status (job ${job.id})`)
    await processSchedulerJob()
  },
  {
    connection: redis,
    concurrency: 1,
  },
)

schedulerWorker.on('failed', (job, err) => {
  console.error(`[Scheduler] Job ${job?.id} falhou:`, err.message)
})

schedulerWorker.on('completed', (job) => {
  console.log(`[Scheduler] Job ${job.id} concluído`)
})
