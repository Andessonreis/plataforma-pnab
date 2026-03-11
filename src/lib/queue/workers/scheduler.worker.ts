import { Worker } from 'bullmq'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import type { EditalStatus } from '@prisma/client'

export interface SchedulerJobData {
  trigger: 'cron'
}

interface CronogramaItem {
  label: string
  dataHora: string
  destaque?: boolean
}

/**
 * Normaliza texto para matching fuzzy de labels do cronograma.
 * Remove acentos, converte para minúsculas e remove espaços extras.
 */
function normalize(text: string): string {
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
function matchLabel(label: string, patterns: string[]): boolean {
  const normalized = normalize(label)
  return patterns.some((p) => normalized.includes(p))
}

// Padrões de labels para cada transição
const INICIO_INSCRICOES_PATTERNS = [
  'inicio das inscricoes',
  'inicio inscricoes',
  'abertura das inscricoes',
  'abertura inscricoes',
  'inscricoes abertas',
]

const ENCERRAMENTO_INSCRICOES_PATTERNS = [
  'encerramento das inscricoes',
  'encerramento inscricoes',
  'fim das inscricoes',
  'fim inscricoes',
  'inscricoes encerradas',
]

export const schedulerWorker = new Worker<SchedulerJobData>(
  'scheduler',
  async (job) => {
    console.log(`[Scheduler] Verificando transições de status (job ${job.id})`)

    const now = new Date()

    // Busca editais que podem ter transição automática
    const editais = await prisma.edital.findMany({
      where: {
        status: { in: ['PUBLICADO', 'INSCRICOES_ABERTAS'] },
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
      const cronograma = (edital.cronograma as unknown as CronogramaItem[]) || []

      let novoStatus: EditalStatus | null = null

      if (edital.status === 'PUBLICADO') {
        // Verificar se a data de início das inscrições já passou
        const item = cronograma.find((c) => matchLabel(c.label, INICIO_INSCRICOES_PATTERNS))
        if (item?.dataHora && new Date(item.dataHora) <= now) {
          novoStatus = 'INSCRICOES_ABERTAS'
        }
      } else if (edital.status === 'INSCRICOES_ABERTAS') {
        // Verificar se a data de encerramento das inscrições já passou
        const item = cronograma.find((c) => matchLabel(c.label, ENCERRAMENTO_INSCRICOES_PATTERNS))
        if (item?.dataHora && new Date(item.dataHora) <= now) {
          novoStatus = 'INSCRICOES_ENCERRADAS'
        }
      }

      if (novoStatus) {
        await prisma.edital.update({
          where: { id: edital.id },
          data: { status: novoStatus },
        })

        await logAudit({
          action: AUDIT_ACTIONS.STATUS_ALTERADO,
          entity: 'Edital',
          entityId: edital.id,
          details: {
            titulo: edital.titulo,
            statusAnterior: edital.status,
            novoStatus,
            automatico: true,
          },
        })

        console.log(`[Scheduler] Edital "${edital.titulo}": ${edital.status} → ${novoStatus}`)
        transicoes++
      }
    }

    console.log(`[Scheduler] Concluído — ${transicoes} transição(ões) realizada(s)`)
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
